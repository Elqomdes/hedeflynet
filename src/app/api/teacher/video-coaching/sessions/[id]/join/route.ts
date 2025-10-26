import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { VideoCoachingService } from '@/lib/services/videoCoachingService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    await connectDB();
    const videoCoachingService = VideoCoachingService.getInstance();
    
    // Join video session using real service
    const result = await videoCoachingService.joinVideoSession(id, user.id);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        meetingUrl: result.meetingUrl,
        message: result.message
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.message 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Join video session error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
