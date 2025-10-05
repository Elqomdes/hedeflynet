import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { VideoCoachingService } from '@/lib/services/videoCoachingService';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const videoCoachingService = VideoCoachingService.getInstance();
    
    // Get real video sessions from database
    const sessions = await videoCoachingService.getVideoSessions(user.id);

    return NextResponse.json({ data: sessions });

  } catch (error) {
    console.error('Get video sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, scheduledFor, duration, maxParticipants } = body;

    await connectDB();
    const videoCoachingService = VideoCoachingService.getInstance();
    
    // Create new video session using real service
    const newSession = await videoCoachingService.createVideoSession({
      title,
      description,
      teacherId: user.id,
      scheduledFor: new Date(scheduledFor),
      duration: parseInt(duration),
      maxParticipants: parseInt(maxParticipants)
    });

    return NextResponse.json({ 
      success: true, 
      data: newSession,
      message: 'Video oturumu başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Create video session error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
