import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Assignment, AssignmentSubmission, Goal, Class } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const studentId = request.nextUrl.searchParams.get('studentId');
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID gerekli' },
        { status: 400 }
      );
    }

    // Database connection
    await connectDB();

    const debugInfo: any = {
      studentId,
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // Check student exists
    try {
      const student = await User.findById(studentId).select('firstName lastName email role');
      debugInfo.checks.student = {
        exists: !!student,
        data: student ? {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          role: student.role
        } : null
      };
    } catch (error) {
      debugInfo.checks.student = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check teacher exists
    try {
      const teacher = await User.findById(authResult._id).select('firstName lastName email role');
      debugInfo.checks.teacher = {
        exists: !!teacher,
        data: teacher ? {
          id: teacher._id,
          name: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email,
          role: teacher.role
        } : null
      };
    } catch (error) {
      debugInfo.checks.teacher = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check assignments
    try {
      const assignments = await Assignment.find({ studentId: studentId }).select('title dueDate teacherId');
      debugInfo.checks.assignments = {
        count: assignments.length,
        data: assignments.map(a => ({
          id: a._id,
          title: a.title,
          subject: (a as any).subject || 'Genel',
          dueDate: a.dueDate,
          teacherId: a.teacherId
        }))
      };
    } catch (error) {
      debugInfo.checks.assignments = {
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check submissions
    try {
      const submissions = await AssignmentSubmission.find({ studentId }).select('assignmentId grade submittedAt');
      debugInfo.checks.submissions = {
        count: submissions.length,
        data: submissions.map(s => ({
          id: s._id,
          assignmentId: s.assignmentId,
          grade: s.grade,
          submittedAt: s.submittedAt
        }))
      };
    } catch (error) {
      debugInfo.checks.submissions = {
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check goals
    try {
      const goals = await Goal.find({ studentId }).select('title description status progress targetDate');
      debugInfo.checks.goals = {
        count: goals.length,
        data: goals.map(g => ({
          id: g._id,
          title: g.title,
          description: g.description,
          status: g.status,
          progress: g.progress,
          targetDate: g.targetDate
        }))
      };
    } catch (error) {
      debugInfo.checks.goals = {
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check student class
    try {
      const student = await User.findById(studentId).select('classId');
      if (student && (student as any).classId) {
        const classData = await Class.findById((student as any).classId).select('name description');
        debugInfo.checks.class = {
          exists: !!classData,
          data: classData ? {
            id: classData._id,
            name: classData.name,
            description: classData.description
          } : null
        };
      } else {
        debugInfo.checks.class = {
          exists: false,
          data: null
        };
      }
    } catch (error) {
      debugInfo.checks.class = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Database connection status
    debugInfo.checks.database = {
      connected: true,
      readyState: 'connected'
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Debug report data error:', error);
    return NextResponse.json(
      { 
        error: 'Debug bilgileri alınamadı',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
