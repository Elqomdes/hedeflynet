import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { VideoCoachingService } from '@/lib/services/videoCoachingService';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'upcoming' | 'all' || 'all';

    const videoCoachingService = VideoCoachingService.getInstance();

    if (type === 'upcoming') {
      const sessions = await videoCoachingService.getUpcomingSessions(user.id, user.role as 'teacher' | 'student');
      return NextResponse.json({ sessions });
    } else {
      const sessions = await videoCoachingService.getUserVideoSessions(user.id, user.role as 'teacher' | 'student');
      return NextResponse.json({ sessions });
    }
  } catch (error) {
    console.error('Get video sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, studentId, type, scheduledFor, duration, agenda } = body;

    if (!title || !description || !studentId || !type || !scheduledFor || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const videoCoachingService = VideoCoachingService.getInstance();
    const session = await videoCoachingService.createVideoSession({
      title,
      description,
      teacherId: user.id,
      studentId,
      type,
      scheduledFor: new Date(scheduledFor),
      duration,
      agenda
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Create video session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
