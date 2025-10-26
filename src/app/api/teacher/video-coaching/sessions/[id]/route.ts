import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { VideoSession } from '@/lib/models/VideoCoaching';

export async function PATCH(
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
    const body = await request.json();
    const { status } = body;

    await connectDB();

    // Find and update the video session
    const session = await VideoSession.findById(id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if user is the teacher of this session
    const sessionTeacherId = typeof session.teacherId === 'object' 
      ? session.teacherId._id?.toString() || session.teacherId.toString()
      : session.teacherId.toString();
    
    const userId = user._id?.toString() || String(user._id);

    if (sessionTeacherId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update status
    if (status) {
      session.status = status;
    }

    await session.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Session updated successfully',
      data: session
    });

  } catch (error) {
    console.error('Update video session error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
