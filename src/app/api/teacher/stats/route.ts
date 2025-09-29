import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Class, Assignment, Goal, AssignmentSubmission } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const teacherId = authResult._id;

    const [totalStudents, totalClasses, totalAssignments, totalGoals, submittedAssignments, gradedAssignments, pendingGrading] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Class.countDocuments({ 
        $or: [
          { teacherId },
          { coTeachers: teacherId }
        ]
      }),
      Assignment.countDocuments({ teacherId }),
      Goal.countDocuments({ teacherId }),
      AssignmentSubmission.countDocuments({ 
        assignmentId: { $in: await Assignment.find({ teacherId }).distinct('_id') },
        status: 'submitted'
      }),
      AssignmentSubmission.countDocuments({ 
        assignmentId: { $in: await Assignment.find({ teacherId }).distinct('_id') },
        status: 'graded'
      }),
      AssignmentSubmission.countDocuments({ 
        assignmentId: { $in: await Assignment.find({ teacherId }).distinct('_id') },
        status: 'submitted'
      })
    ]);

    // Calculate grading rate
    const gradingRate = submittedAssignments > 0 
      ? Math.round((gradedAssignments / submittedAssignments) * 100)
      : 0;

    return NextResponse.json({
      totalStudents,
      totalClasses,
      totalAssignments,
      totalGoals,
      submittedAssignments,
      gradedAssignments,
      pendingGrading,
      gradingRate
    });
  } catch (error) {
    console.error('Teacher stats error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
