import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Class, Assignment, Goal } from '@/lib/models';
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

    const [totalStudents, totalClasses, totalAssignments, totalGoals] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Class.countDocuments({ 
        $or: [
          { teacherId },
          { coTeachers: teacherId }
        ]
      }),
      Assignment.countDocuments({ teacherId }),
      Goal.countDocuments({ teacherId })
    ]);

    return NextResponse.json({
      totalStudents,
      totalClasses,
      totalAssignments,
      totalGoals
    });
  } catch (error) {
    console.error('Teacher stats error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
