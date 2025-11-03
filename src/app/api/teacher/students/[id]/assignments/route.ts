import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Assignment from '@/lib/models/Assignment';
import AssignmentSubmission from '@/lib/models/AssignmentSubmission';
import User from '@/lib/models/User';
import { safeIdToString } from '@/lib/utils/idHelper';

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

    const studentId = params.id;
    const teacherId = String(authResult._id);

    // Verify student belongs to teacher's classes
    const student = await User.findById(studentId).select('firstName lastName email');
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get all submissions for this student first
    const submissions = await AssignmentSubmission.find({
      studentId: studentId,
      status: { $in: ['graded', 'completed'] } // Only completed assignments
    }).sort({ submittedAt: -1 });

    if (submissions.length === 0) {
      return NextResponse.json({
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email
        },
        assignments: []
      });
    }

    // Get assignment IDs from submissions
    const assignmentIds = submissions.map(sub => sub.assignmentId);

    // Get assignments for these submissions
    const assignments = await Assignment.find({
      _id: { $in: assignmentIds },
      teacherId: teacherId
    })
      .populate('classId', 'name')
      .sort({ dueDate: -1 });

    // Create a map of submissions by assignment ID
    const submissionMap = new Map();
    submissions.forEach(submission => {
      submissionMap.set(submission.assignmentId.toString(), submission);
    });

    // Combine assignments with their submissions
    const assignmentsWithSubmissions = assignments.map(assignment => {
      const submission = submissionMap.get(safeIdToString(assignment._id));
      
      return {
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        type: assignment.type,
        dueDate: assignment.dueDate,
        maxGrade: assignment.maxGrade,
        classId: assignment.classId,
        createdAt: assignment.createdAt,
        submission: submission ? {
          _id: submission._id,
          status: submission.status,
          grade: submission.grade,
          maxGrade: submission.maxGrade,
          teacherFeedback: submission.teacherFeedback,
          submittedAt: submission.submittedAt,
          gradedAt: submission.gradedAt,
          content: submission.content
        } : null
      };
    });

    return NextResponse.json({
      student: {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email
      },
      assignments: assignmentsWithSubmissions
    });

  } catch (error) {
    console.error('Get student assignments error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
