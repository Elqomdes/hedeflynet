import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import AssignmentSubmission from '@/lib/models/AssignmentSubmission';
import Assignment from '@/lib/models/Assignment';
import { Parent } from '@/lib/models';
import { createParentNotificationsForStudent } from '@/lib/utils/createParentNotification';

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

    const { grade, teacherFeedback, status } = await request.json();

    if (grade !== undefined && (grade < 0 || grade > 100)) {
      return NextResponse.json(
        { error: 'Grade must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (status && !['completed', 'incomplete', 'submitted', 'graded', 'late'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    await connectDB();

    const submissionId = params.id;
    const teacherId = String(authResult._id);

    // Find the submission and verify teacher has access
    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('assignmentId');

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check if the assignment belongs to this teacher
    const assignment = submission.assignmentId as any;
    if (assignment.teacherId.toString() !== String(teacherId)) {
      return NextResponse.json(
        { error: 'Unauthorized to grade this submission' },
        { status: 403 }
      );
    }

    // Update the submission
    const updateData: any = {
      gradedAt: new Date()
    };

    if (grade !== undefined) {
      const max = assignment.maxGrade || 100;
      if (grade > max) {
        return NextResponse.json(
          { error: `Grade cannot exceed maxGrade (${max})` },
          { status: 400 }
        );
      }
      updateData.grade = grade;
      updateData.maxGrade = max;
      // If teacher sets a grade, default status to 'graded' unless explicitly provided
      if (!status) {
        updateData.status = 'graded';
      }
    }

    if (teacherFeedback !== undefined) {
      updateData.teacherFeedback = teacherFeedback;
    }

    if (status) {
      updateData.status = status;
    }

    const updatedSubmission = await AssignmentSubmission.findByIdAndUpdate(
      submissionId,
      updateData,
      { new: true }
    ).populate('studentId', 'firstName lastName email');

    // Create notification for parent if assignment is graded
    if (updatedSubmission && updateData.status === 'graded' && grade !== undefined) {
      const student = updatedSubmission.studentId as any;
      const studentId = String(student._id);
      
      await createParentNotificationsForStudent(studentId, {
        type: 'assignment_graded',
        title: 'Ödev Değerlendirildi',
        message: `${student.firstName} ${student.lastName}'ın "${assignment.title}" ödevi değerlendirildi. Not: ${grade}/${assignment.maxGrade || 100}`,
        priority: grade >= 70 ? 'low' : grade >= 50 ? 'medium' : 'high',
        data: {
          assignmentId: String(assignment._id),
          assignmentTitle: assignment.title,
          grade,
          maxGrade: assignment.maxGrade || 100,
          submissionId: String(updatedSubmission._id)
        }
      });
    }

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error('Grade submission error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
