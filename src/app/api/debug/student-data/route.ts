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

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const teacherId = authResult._id;

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Database connection
    await connectDB();

    console.log('Debug: Starting student data collection', { studentId, teacherId });

    // Check student exists
    const student = await User.findById(studentId).select('firstName lastName email role isActive classId');
    console.log('Debug: Student found', { 
      exists: !!student, 
      name: student?.firstName, 
      role: student?.role,
      isActive: student?.isActive,
      classId: student?.classId
    });

    if (!student) {
      return NextResponse.json({
        error: 'Student not found',
        studentId,
        debug: {
          studentExists: false,
          teacherId: teacherId.toString()
        }
      });
    }

    if (student.role !== 'student') {
      return NextResponse.json({
        error: 'User is not a student',
        studentId,
        debug: {
          studentRole: student.role,
          expectedRole: 'student'
        }
      });
    }

    if (!student.isActive) {
      return NextResponse.json({
        error: 'Student is not active',
        studentId,
        debug: {
          isActive: student.isActive
        }
      });
    }

    // Check teacher exists
    const teacher = await User.findById(teacherId).select('firstName lastName email role isActive');
    console.log('Debug: Teacher found', { 
      exists: !!teacher, 
      name: teacher?.firstName, 
      role: teacher?.role,
      isActive: teacher?.isActive
    });

    if (!teacher) {
      return NextResponse.json({
        error: 'Teacher not found',
        teacherId: teacherId.toString(),
        debug: {
          teacherExists: false
        }
      });
    }

    // Get assignments
    const assignments = await Assignment.find({ studentId }).populate('teacherId', 'firstName lastName');
    console.log('Debug: Assignments found', { count: assignments.length });

    // Get submissions
    const submissions = await AssignmentSubmission.find({ studentId }).populate('assignmentId');
    console.log('Debug: Submissions found', { count: submissions.length });

    // Get goals
    const goals = await Goal.find({ studentId });
    console.log('Debug: Goals found', { count: goals.length });

    // Get student class
    let studentClass = null;
    if (student.classId) {
      studentClass = await Class.findById(student.classId);
      console.log('Debug: Student class found', { 
        classId: student.classId, 
        className: studentClass?.name 
      });
    }

    // Calculate basic stats
    const totalAssignments = assignments.length;
    const submittedAssignments = submissions.length;
    const gradedAssignments = submissions.filter(s => s.grade !== null && s.grade !== undefined).length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;

    const debugData = {
      student: {
        _id: student._id.toString(),
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        role: student.role,
        isActive: student.isActive,
        classId: student.classId?.toString()
      },
      teacher: {
        _id: teacher._id.toString(),
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        role: teacher.role,
        isActive: teacher.isActive
      },
      stats: {
        totalAssignments,
        submittedAssignments,
        gradedAssignments,
        totalGoals: goals.length,
        completedGoals
      },
      assignments: assignments.map(a => ({
        _id: a._id.toString(),
        title: a.title,
        subject: a.subject,
        dueDate: a.dueDate,
        teacherName: a.teacherId ? `${a.teacherId.firstName} ${a.teacherId.lastName}` : 'Unknown'
      })),
      submissions: submissions.map(s => ({
        _id: s._id.toString(),
        assignmentId: s.assignmentId?._id?.toString(),
        grade: s.grade,
        submittedAt: s.submittedAt
      })),
      goals: goals.map(g => ({
        _id: g._id.toString(),
        title: g.title,
        status: g.status,
        progress: g.progress,
        targetDate: g.targetDate
      })),
      class: studentClass ? {
        _id: studentClass._id.toString(),
        name: studentClass.name
      } : null
    };

    return NextResponse.json({
      success: true,
      message: 'Student data collected successfully',
      data: debugData
    });

  } catch (error) {
    console.error('Debug: Error collecting student data', error);
    return NextResponse.json(
      { 
        error: 'Debug data collection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
