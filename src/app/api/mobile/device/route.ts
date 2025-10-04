import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { MobileService } from '@/lib/services/mobileService';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, deviceInfo, deviceId } = body;

    const mobileService = MobileService.getInstance();

    if (action === 'register' && deviceInfo) {
      const result = await mobileService.registerDevice(user.id, deviceInfo);
      return NextResponse.json(result);
    }

    if (action === 'unregister' && deviceId) {
      const result = await mobileService.unregisterDevice(user.id, deviceId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Device action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
