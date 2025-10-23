import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { AnalyticsService } from '@/lib/services/analyticsService';
import connectDB from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const period = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : undefined;

    const analyticsService = AnalyticsService.getInstance();
    const metrics = await analyticsService.getStudentPerformanceMetrics(user.id, period);

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Get student analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
