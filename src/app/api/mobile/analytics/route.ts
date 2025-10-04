import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { MobileService } from '@/lib/services/mobileService';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'week' | 'month' | 'year' || 'month';

    const mobileService = MobileService.getInstance();
    const analytics = await mobileService.getAppAnalytics(user.id, period);

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Get mobile analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
