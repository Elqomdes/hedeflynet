import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
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

    // Collect submissions for this assignment and, if applicable, its sibling
    // assignments that belong to the same class batch (same classId, title,
    // dueDate, and teacherId). This covers the case where class assignments
    // are materialized as individual per-student assignments.
    let assignmentIds = [assignmentId];

    if (assignment.classId) {
      const siblingAssignments = await Assignment.find({
        teacherId,
        classId: assignment.classId,
        title: assignment.title,
        dueDate: assignment.dueDate
      }).distinct('_id');

      if (Array.isArray(siblingAssignments) && siblingAssignments.length > 0) {
        assignmentIds = Array.from(new Set([
          ...assignmentIds,
          ...siblingAssignments.map((id: any) => id.toString())
        ]));
      }
    }

    const submissions = await AssignmentSubmission.find({
      assignmentId: { $in: assignmentIds }
    })
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
