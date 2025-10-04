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
    const settings = await mobileService.getMobileSettings(user.id);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get mobile settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    const mobileService = MobileService.getInstance();
    const result = await mobileService.updateMobileSettings(user.id, settings);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Update mobile settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
