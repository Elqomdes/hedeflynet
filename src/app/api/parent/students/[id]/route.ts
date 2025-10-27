import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentParent } from '@/lib/auth';
import { User, Assignment, AssignmentSubmission, Goal, Class } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Get current parent
    const parent = await getCurrentParent(request);
    if (!parent) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const studentId = params.id;

    // Verify student is child of this parent
    const isAuthorized = parent.children.some(
      (childId: any) => childId.toString() === studentId
    );

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized access to this student' },
        { status: 403 }
      );
    }

    // Get student data
    const student = await User.findById(studentId)
      .select('_id firstName lastName email classId createdAt updatedAt')
      .lean();

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get class name
    let className = '';
    if (student.classId) {
      const classDoc = await Class.findById(student.classId).select('name').lean();
      className = classDoc?.name || '';
    }

    // Get assignments
    const assignments = await Assignment.find({
      $or: [
        { studentId: studentId },
        { students: studentId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get submissions
    const submissionIds = assignments.map(a => a._id.toString());
    const submissions = await AssignmentSubmission.find({
      studentId: studentId,
      assignmentId: { $in: submissionIds }
    }).lean();

    // Create submissions map
    const submissionMap = new Map();
    submissions.forEach(sub => {
      submissionMap.set(sub.assignmentId.toString(), sub);
    });

    // Combine assignments with submissions
    const recentAssignments = assignments.map(assignment => {
      const submission = submissionMap.get(assignment._id.toString());
      return {
        id: assignment._id.toString(),
        title: assignment.title,
        subject: 'Genel',
        dueDate: assignment.dueDate,
        status: submission?.status || 'pending',
        grade: submission?.grade,
        maxGrade: submission?.maxGrade || assignment.maxGrade || 100
      };
    });

    // Get goals
    const goals = await Goal.find({ studentId: studentId }).lean();

    // Calculate stats
    const totalAssignments = assignments.length;
    const completedAssignments = submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length;
    
    let averageGrade = 0;
    const gradedSubmissions = submissions.filter(s => s.status === 'graded' && s.grade !== undefined);
    if (gradedSubmissions.length > 0) {
      averageGrade = Math.round(
        gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
      );
    }

    const goalsTotal = goals.length;
    const goalsAchieved = goals.filter(g => g.status === 'completed').length;

    // Performance chart data (simplified - last 6 months)
    const performanceChart = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('tr-TR', { month: 'short' });
      
      // For now, use average grade (in production, calculate monthly average)
      performanceChart.push({
        month: monthName,
        average: averageGrade
      });
    }

    const studentData = {
      id: student._id.toString(),
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      className: className,
      stats: {
        totalAssignments,
        completedAssignments,
        averageGrade,
        goalsAchieved,
        goalsTotal
      },
      recentAssignments,
      performanceChart
    };

    return NextResponse.json({
      success: true,
      data: studentData
    });

  } catch (error) {
    console.error('Parent student data error:', error);
    return NextResponse.json(
      { 
        error: 'Öğrenci verileri alınamadı',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}

