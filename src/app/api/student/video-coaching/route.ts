import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { VideoCoachingService } from '@/lib/services/videoCoachingService';

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
    
    // Get video sessions for this student
    const sessions = await videoCoachingService.getUserVideoSessions(user.id, 'student');

    // Format sessions for student view
    const formattedSessions = sessions.map(session => ({
      _id: session.id,
      title: session.title,
      description: session.description,
      teacherId: {
        firstName: session.teacher.name.split(' ')[0],
        lastName: session.teacher.name.split(' ')[1] || '',
        email: '' // We don't expose teacher email to students
      },
      scheduledAt: session.scheduledFor,
      duration: session.duration,
      status: session.status === 'in_progress' ? 'ongoing' : session.status,
      meetingUrl: session.meetingUrl,
      platformUrl: session.meetingUrl, // Use meetingUrl as platformUrl for students
      recordingUrl: session.recording?.url,
      notes: session.agenda?.map(item => `${item.topic}: ${item.description || ''}`).join('\n'),
      feedback: session.feedback?.find(f => f.toUser === user.id)?.comment,
      createdAt: new Date().toISOString()
    }));

    return NextResponse.json(formattedSessions);

  } catch (error) {
    console.error('Get student video sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
