import { NextRequest, NextResponse } from 'next/server';
import Jimp from 'jimp';
import jsQR from 'jsqr';

import {
  checkVersion,
  formatVersion1,
  verifyEddsa,
  cborToJson,
  formatLegacyData,
} from '@/lib/philsys/verification';
import { formatDisplayData } from '@/lib/philsys/formatting';
import { PhilIDLegacy, VerificationResult } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

async function verifyQrString(qrString: string, request: NextRequest): Promise<VerificationResult> {
  const version = checkVersion(qrString);

  if (version === 1) {
    let qrData: PhilIDLegacy;
    try {
      qrData = JSON.parse(qrString);
    } catch (error) {
      console.error('[PhilSys] Failed to parse legacy QR JSON:', error);
      return {
        status: 'INVALID',
        type: 'PhilID',
        message: 'Invalid legacy PhilID payload',
      };
    }

    const formattedString = formatVersion1(qrData);
    const isValidSignature = await verifyEddsa(formattedString, qrData.signature);

    if (!isValidSignature) {
      return {
        status: 'INVALID',
        type: 'PhilID',
        message: 'Signature verification failed',
      };
    }

    const formattedData = formatLegacyData(qrData);
    const displayData = formatDisplayData(qrData, true);

    try {
      const origin = new URL(request.url).origin;
      const response = await fetch(`${origin}/api/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (response.status === 200) {
        return {
          status: 'ACTIVATED',
          type: 'PhilID',
          data: formattedData,
          displayData,
        };
      }

      return {
        status: 'REVOKED',
        type: 'PhilID',
        data: formattedData,
        displayData,
        message: 'PhilID is not activated',
      };
    } catch (error) {
      console.error('[PhilSys] Online verification failed:', error);
      return {
        status: 'ERROR',
        type: 'PhilID',
        data: formattedData,
        displayData,
        message: 'Online verification failed',
      };
    }
  }

  const objVal = cborToJson(qrString);

  if (!objVal) {
    return {
      status: 'INVALID',
      type: 'ePhilID',
      message: 'Failed to decode ePhilID data',
    };
  }

  const displayData = formatDisplayData(objVal);

  try {
    const origin = new URL(request.url).origin;
    const response = await fetch(`${origin}/api/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(objVal),
    });

    if (response.status === 200) {
      return {
        status: 'ACTIVATED',
        type: 'ePhilID',
        data: objVal,
        displayData,
      };
    }

    return {
      status: 'REVOKED',
      type: 'ePhilID',
      data: objVal,
      displayData,
      message: 'ePhilID is not activated',
    };
  } catch (error) {
    console.error('[PhilSys] Online verification failed:', error);
    return {
      status: 'ERROR',
      type: 'ePhilID',
      data: objVal,
      displayData,
      message: 'Online verification failed',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing image file' },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const image = await Jimp.read(buffer);
    const { width, height, data } = image.bitmap;

    if (!width || !height) {
      return NextResponse.json(
        { error: 'Invalid image dimensions' },
        { status: 400 },
      );
    }

    const clampedData = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
    const code = jsQR(clampedData, width, height);

    if (!code?.data) {
      return NextResponse.json(
        { error: 'Unable to detect QR code in image' },
        { status: 422 },
      );
    }

    const qrString = code.data.trim();
    const verification = await verifyQrString(qrString, request);

    return NextResponse.json({
      qrString,
      result: verification,
    });
  } catch (error) {
    console.error('[PhilSys] Image scan error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 },
    );
  }
}
