import { NextRequest, NextResponse } from 'next/server';
import { MobileService } from '@/lib/services/mobileService';

export async function GET(request: NextRequest) {
  try {
    const mobileService = MobileService.getInstance();
    const config = await mobileService.getAppConfiguration();

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Get mobile config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
