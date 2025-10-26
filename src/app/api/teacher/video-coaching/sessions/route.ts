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
    const sessions = await videoCoachingService.getUserVideoSessions(user.id, 'teacher');

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
    const { title, description, scheduledFor, duration, platformUrl, selectedStudents } = body;

    if (!title || !description || !scheduledFor || !duration || !platformUrl || !selectedStudents || selectedStudents.length === 0) {
      return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
    }

    await connectDB();
    const videoCoachingService = VideoCoachingService.getInstance();
    
    // Create video sessions for each selected student
    const sessions = [];
    for (const studentId of selectedStudents) {
      const newSession = await videoCoachingService.createVideoSession({
        title,
        description,
        teacherId: user.id,
        studentId,
        type: 'one_on_one' as 'one_on_one' | 'group' | 'class' | 'consultation',
        scheduledFor: new Date(scheduledFor),
        duration: parseInt(duration),
        platformUrl
      });
      sessions.push(newSession);
    }

    return NextResponse.json({ 
      success: true, 
      data: sessions,
      message: `${sessions.length} video oturumu başarıyla oluşturuldu`
    });

  } catch (error) {
    console.error('Create video session error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
