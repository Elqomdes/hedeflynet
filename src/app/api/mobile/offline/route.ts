import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { MobileService } from '@/lib/services/mobileService';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mobileService = MobileService.getInstance();
    const offlineData = await mobileService.getOfflineData(user.id);

    return NextResponse.json({ offlineData });
  } catch (error) {
    console.error('Get offline data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { offlineData } = body;

    const mobileService = MobileService.getInstance();
    const result = await mobileService.syncOfflineData(user.id, offlineData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sync offline data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
