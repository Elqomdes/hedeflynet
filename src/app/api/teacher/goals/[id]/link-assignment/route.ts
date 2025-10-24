import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Goal, Assignment } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { assignmentId } = await request.json();

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    // Verify the goal belongs to the teacher
    const goal = await Goal.findOne({
      _id: params.id,
      teacherId: authResult._id
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Verify the assignment belongs to the teacher
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      teacherId: authResult._id
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Link the assignment to the goal
    goal.assignmentId = assignmentId;
    await goal.save();

    return NextResponse.json({
      success: true,
      message: 'Assignment linked to goal successfully',
      goal
    });
  } catch (error) {
    console.error('Link assignment to goal error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
