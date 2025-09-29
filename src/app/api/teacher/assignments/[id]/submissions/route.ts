import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Assignment from '@/lib/models/Assignment';
import AssignmentSubmission from '@/lib/models/AssignmentSubmission';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

export async function GET(
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

    const assignmentId = params.id;
    const teacherId = authResult._id;

    // Check if the assignment belongs to this teacher
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || assignment.teacherId.toString() !== teacherId) {
      return NextResponse.json(
        { error: 'Assignment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get all submissions for this assignment
    const submissions = await AssignmentSubmission.find({ assignmentId })
      .populate('studentId', 'firstName lastName email')
      .sort({ submittedAt: -1 });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Get assignment submissions error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
