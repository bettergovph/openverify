import { NextRequest, NextResponse } from 'next/server';

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
    // Tokens/cookies should be provided via PHILSYS_VERIFY_COOKIE env to avoid hardcoding secrets.
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
      Referer: 'https://verify.philsys.gov.ph/',
    });

    const cookie = process.env.PHILSYS_VERIFY_COOKIE;
    if (cookie) {
      headers.set('cookie', cookie);
    }

    const philsysResponse = await fetch('https://verify.philsys.gov.ph/api/verify', {
      method: 'POST',
      headers,
      body: JSON.stringify(qrData),
    });

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
