import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stat, type } = body;

    if (!stat || !type) {
      return NextResponse.json(
        { error: 'Missing stat or type parameter' },
        { status: 400 }
      );
    }

    // Log the status for analytics/monitoring
    console.log(`[PhilSys Verification] Status: ${stat}, Type: ${type}, Timestamp: ${new Date().toISOString()}`);
    
    // In a production environment, you might want to:
    // - Store this in a database
    // - Send to analytics service
    // - Log to monitoring system
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Status logging error:', error);
    return NextResponse.json(
      { error: 'Failed to log status' },
      { status: 500 }
    );
  }
}
