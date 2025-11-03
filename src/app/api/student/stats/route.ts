import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Assignment, AssignmentSubmission, Class } from '@/lib/models';
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

    const [totalAssignments, completedAssignments, submittedAssignments, gradedAssignments, totalClasses, gradedSubs] = await Promise.all([
      Assignment.countDocuments({ studentId }),
      // Completed includes both 'completed' and 'graded'
      AssignmentSubmission.countDocuments({ 
        studentId,
        status: { $in: ['completed', 'graded'] }
      }),
      // Submitted includes submitted, late, completed, graded
      AssignmentSubmission.countDocuments({ 
        studentId,
        status: { $in: ['submitted', 'late', 'completed', 'graded'] }
      }),
      AssignmentSubmission.countDocuments({ 
        studentId, 
        status: 'graded' 
      }),
      Class.countDocuments({ students: studentId }),
      AssignmentSubmission.find({ studentId, status: 'graded' }, { grade: 1, maxGrade: 1 }).lean()
    ]);

    let averageGrade = 0;
    if (Array.isArray(gradedSubs) && gradedSubs.length > 0) {
      // Average as percentage out of 100 using maxGrade when present
      const totalPct = gradedSubs.reduce((sum: number, s: any) => {
        const max = s.maxGrade || 100;
        const grade = typeof s.grade === 'number' ? s.grade : 0;
        return sum + (max > 0 ? (grade / max) * 100 : 0);
      }, 0);
      averageGrade = totalPct / gradedSubs.length;
    }

    return NextResponse.json({
      totalAssignments,
      completedAssignments,
      submittedAssignments,
      gradedAssignments,
      totalClasses,
      videoSessions: 0,
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
