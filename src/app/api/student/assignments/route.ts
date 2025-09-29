import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Assignment, AssignmentSubmission } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const studentId = authResult._id;

    // Get assignments for this student
    const assignments = await Assignment.find({ studentId })
      .populate('teacherId', 'firstName lastName')
      .populate('classId', 'name')
      .sort({ dueDate: 1 });

    // Get submission status for each assignment
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await AssignmentSubmission.findOne({
          assignmentId: assignment._id,
          studentId
        });

        return {
          ...assignment.toObject(),
          submission: submission ? {
            status: submission.status,
            submittedAt: submission.submittedAt,
            grade: submission.grade,
            maxGrade: submission.maxGrade,
            feedback: submission.feedback,
            teacherFeedback: submission.teacherFeedback,
            gradedAt: submission.gradedAt,
            content: submission.content,
            attachments: submission.attachments
          } : null
        };
      })
    );

    return NextResponse.json(assignmentsWithStatus);
  } catch (error) {
    console.error('Student assignments error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

