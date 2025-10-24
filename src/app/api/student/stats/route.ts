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

    const [totalAssignments, completedAssignments, submittedAssignments, gradedAssignments] = await Promise.all([
      Assignment.countDocuments({ studentId }),
      AssignmentSubmission.countDocuments({ 
        studentId, 
        status: 'completed' 
      }),
      AssignmentSubmission.countDocuments({ 
        studentId, 
        status: 'submitted' 
      }),
      AssignmentSubmission.countDocuments({ 
        studentId, 
        status: 'graded' 
      })
    ]);

    return NextResponse.json({
      totalAssignments,
      completedAssignments,
      submittedAssignments,
      gradedAssignments
    });
  } catch (error) {
    console.error('Student stats error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
