import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Environment variable'ları kontrol et (güvenlik için sadece varlığını kontrol et)
    const hasMongoUri = !!process.env.MONGODB_URI;
    const nodeEnv = process.env.NODE_ENV;
    const vercelEnv = process.env.VERCEL_ENV;
    
    return NextResponse.json({
      status: 'success',
      environment: {
        NODE_ENV: nodeEnv,
        VERCEL_ENV: vercelEnv,
        MONGODB_URI: hasMongoUri ? 'SET' : 'NOT_SET',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Environment test failed:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Environment test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
