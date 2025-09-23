import { NextResponse } from 'next/server';
import { buildDetailList, normalizeEVerifyCheck, toPersonalInfo } from '@/lib/everify';

const EV_BASE = 'https://app-ws.everify.gov.ph';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const value = body?.value;

    if (!value || typeof value !== 'string') {
      return NextResponse.json({ error: 'Missing QR value' }, { status: 400 });
    }

    const upstream = await fetch(`${EV_BASE}/api/pub/qr/check`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/plain, */*',
      },
      body: JSON.stringify({ value: value.trim() }),
    });

    const raw = await upstream.json().catch(() => null);

    if (!upstream.ok || !raw) {
      return NextResponse.json(
        {
          error: 'Upstream eVerify request failed',
          status: upstream.status,
          body: raw ?? null,
        },
        { status: upstream.status || 502 }
      );
    }

    const normalized = normalizeEVerifyCheck(raw);
    const personalInfo = toPersonalInfo(normalized);
    const details = buildDetailList(normalized);

    return NextResponse.json({
      normalized,
      personalInfo,
      details,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Unable to process eVerify request',
        message: error?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}
