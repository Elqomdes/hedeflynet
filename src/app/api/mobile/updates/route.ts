import { NextRequest, NextResponse } from 'next/server';
import { MobileService } from '@/lib/services/mobileService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentVersion = searchParams.get('version') || '1.0.0';

    const mobileService = MobileService.getInstance();
    const updateInfo = await mobileService.checkForUpdates(currentVersion);

    return NextResponse.json({ updateInfo });
  } catch (error) {
    console.error('Check updates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
