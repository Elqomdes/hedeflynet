import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Report modeli kaldırıldı, bu endpoint artık kullanılmıyor
    return NextResponse.json(
      { error: 'Bu endpoint artık kullanılmıyor. Raporlar dinamik olarak oluşturuluyor.' },
      { status: 410 }
    );
  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
