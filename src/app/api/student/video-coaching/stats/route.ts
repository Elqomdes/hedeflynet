import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { VideoCoachingService } from '@/lib/services/videoCoachingService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const videoCoachingService = VideoCoachingService.getInstance();
    
    // Get real video coaching statistics from database
    const stats = await videoCoachingService.getStudentVideoStats(user.id);

    return NextResponse.json({ data: stats });

  } catch (error) {
    console.error('Get student video coaching stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
