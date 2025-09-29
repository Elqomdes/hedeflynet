import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Assignment, AssignmentSubmission, Goal, Plan } from '@/lib/models';
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

    const [totalAssignments, completedAssignments, totalGoals, completedGoals, totalPlans, completedPlans] = await Promise.all([
      Assignment.countDocuments({ studentId }),
      AssignmentSubmission.countDocuments({ 
        studentId, 
        status: 'completed' 
      }),
      Goal.countDocuments({ studentId }),
      Goal.countDocuments({ 
        studentId, 
        status: 'completed' 
      }),
      Plan.countDocuments({ studentId }),
      Plan.countDocuments({ 
        studentId,
        'tasks.completed': true
      })
    ]);

    return NextResponse.json({
      totalAssignments,
      completedAssignments,
      totalGoals,
      completedGoals,
      totalPlans,
      completedPlans
    });
  } catch (error) {
    console.error('Student stats error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
