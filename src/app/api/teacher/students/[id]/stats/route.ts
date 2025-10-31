import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Assignment, AssignmentSubmission, Goal } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

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

    const [totalAssignments, completedAssignments, totalGoals, completedGoals, averageGrade] = await Promise.all([
      Assignment.countDocuments({ studentId }),
      AssignmentSubmission.countDocuments({ 
        studentId, 
        status: { $in: ['completed', 'submitted', 'graded'] }
      }),
      Goal.countDocuments({ studentId }),
      Goal.countDocuments({ 
        studentId, 
        status: 'completed' 
      }),
      AssignmentSubmission.aggregate([
        { $match: { studentId, grade: { $exists: true, $ne: null } } },
        { $group: { _id: null, average: { $avg: '$grade' } } }
      ]).then(result => result[0]?.average || 0)
    ]);

    return NextResponse.json({
      totalAssignments,
      completedAssignments,
      totalGoals,
      completedGoals,
      averageGrade
    });
  } catch (error) {
    console.error('Student stats error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
