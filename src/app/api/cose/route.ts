import { NextRequest, NextResponse } from 'next/server';
import { cborToJson } from '@/lib/philsys/verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coseStrng } = body;

    if (!coseStrng) {
      return NextResponse.json(
        { error: 'Missing coseStrng parameter' },
        { status: 400 }
      );
    }

    // Attempt to decode the COSE string
    const result = cborToJson(coseStrng);
    
    // Return true if decoding was successful, false otherwise
    return NextResponse.json(result !== null);
    
  } catch (error) {
    console.error('COSE verification error:', error);
    return NextResponse.json(false);
  }
}
