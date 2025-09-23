import { NextRequest, NextResponse } from 'next/server';
import { getPhilSysCookie, capturePhilSysCookies } from '@/lib/philsys/session';

export async function POST(request: NextRequest) {
  try {
    const qrData = await request.json();

    if (!qrData) {
      return NextResponse.json(
        { error: 'Missing QR data' },
        { status: 400 }
      );
    }

    // Mirror the publicly observed request headers so the upstream accepts our call.
    // Either reuse a supplied cookie or bootstrap it programmatically.
    const headers = new Headers({
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/json',
      'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      Referer: 'https://verify.philsys.gov.ph/',
    });

    const cookie = await getPhilSysCookie();
    if (!cookie) {
      return NextResponse.json(
        { error: 'Unable to establish PhilSys session' },
        { status: 503 },
      );
    }
    headers.set('cookie', cookie);

    const philsysResponse = await fetch('https://verify.philsys.gov.ph/api/verify', {
      method: 'POST',
      headers,
      body: JSON.stringify(qrData),
    });

    capturePhilSysCookies(philsysResponse);

    // Return the response status and data
    const responseData = await philsysResponse.json().catch(() => ({}));
    
    return NextResponse.json(responseData, { 
      status: philsysResponse.status 
    });
    
  } catch (error) {
    console.error('PhilSys verification error:', error);
    
    // Return error status
    return NextResponse.json(
      { error: 'Verification service unavailable' },
      { status: 503 }
    );
  }
}
