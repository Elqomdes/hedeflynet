import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { AdaptiveLearningService } from '@/lib/services/adaptiveLearningService';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adaptiveLearningService = AdaptiveLearningService.getInstance();
    const dashboard = await adaptiveLearningService.getStudentDashboard(user.id);

    return NextResponse.json({ dashboard });
  } catch (error) {
    console.error('Get adaptive learning dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
