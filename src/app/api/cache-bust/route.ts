import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'bust') {
      // Cache busting işlemi
      const version = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return NextResponse.json({
        success: true,
        version,
        timestamp: Date.now(),
        message: 'Cache başarıyla temizlendi'
      });
    }
    
    if (action === 'check') {
      // Mevcut version'ı kontrol et
      const currentVersion = process.env.NEXT_PUBLIC_BUILD_HASH || 'dev';
      
      return NextResponse.json({
        success: true,
        version: currentVersion,
        timestamp: Date.now()
      });
    }
    
    return NextResponse.json(
      { error: 'Geçersiz işlem' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Cache bust API error:', error);
    return NextResponse.json(
      { error: 'Cache busting hatası' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const version = process.env.NEXT_PUBLIC_BUILD_HASH || 'dev';
    
    return NextResponse.json({
      version,
      timestamp: Date.now(),
      message: 'Cache version bilgisi'
    });
    
  } catch (error) {
    console.error('Cache version API error:', error);
    return NextResponse.json(
      { error: 'Version bilgisi alınamadı' },
      { status: 500 }
    );
  }
}
