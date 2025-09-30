import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import AssignmentSubmission from '@/lib/models/AssignmentSubmission';
import Assignment from '@/lib/models/Assignment';

export const dynamic = 'force-dynamic';

export async function PUT(
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

    const submission = await AssignmentSubmission.findById(params.id).populate('assignmentId');
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const assignment = submission.assignmentId as any;
    if (assignment.teacherId.toString() !== authResult._id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Reopen: clear grade and teacher feedback, set status depending on due date
    submission.grade = undefined;
    submission.teacherFeedback = undefined;
    submission.gradedAt = undefined;
    const now = new Date();
    const isLate = assignment.dueDate && new Date(assignment.dueDate) < now;
    submission.status = isLate ? 'late' : 'submitted';

    await submission.save();

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Reopen submission error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}


