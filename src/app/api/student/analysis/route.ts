import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Assignment from '@/lib/models/Assignment';
import AssignmentSubmission from '@/lib/models/AssignmentSubmission';
import Goal from '@/lib/models/Goal';

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

    // Get assignment statistics
    const totalAssignments = await Assignment.countDocuments({ studentId });
    const submittedAssignments = await AssignmentSubmission.countDocuments({ 
      studentId, 
      status: 'submitted' 
    });
    const gradedAssignments = await AssignmentSubmission.countDocuments({ 
      studentId, 
      status: 'graded' 
    });
    
    const assignmentCompletion = totalAssignments > 0 
      ? Math.round((submittedAssignments / totalAssignments) * 100)
      : 0;
    
    const gradingRate = submittedAssignments > 0 
      ? Math.round((gradedAssignments / submittedAssignments) * 100)
      : 0;

    // Get average grade
    const gradedSubmissions = await AssignmentSubmission.find({
      studentId,
      status: 'graded',
      grade: { $exists: true }
    }).populate('assignmentId', 'maxGrade');

    let averageGrade = 0;
    if (gradedSubmissions.length > 0) {
      const totalGrade = gradedSubmissions.reduce((sum, submission) => {
        const maxGrade = (submission.assignmentId as any)?.maxGrade || 100;
        return sum + (submission.grade || 0);
      }, 0);
      averageGrade = Math.round(totalGrade / gradedSubmissions.length);
    }

    // Get goals progress
    const totalGoals = await Goal.countDocuments({ studentId });
    const completedGoals = await Goal.countDocuments({ 
      studentId, 
      status: 'completed' 
    });
    const goalsProgress = totalGoals > 0 
      ? Math.round((completedGoals / totalGoals) * 100)
      : 0;

    // Get subject statistics
    const assignments = await Assignment.find({ studentId }).populate('classId', 'name');
    const subjectStats: { [key: string]: { 
      completion: number; 
      averageGrade: number; 
      totalAssignments: number; 
      submittedAssignments: number; 
      gradedAssignments: number 
    }} = {};
    
    const subjectGroups: { [key: string]: any[] } = {};
    assignments.forEach(assignment => {
      const subject = (assignment.classId as any)?.name || 'Genel';
      if (!subjectGroups[subject]) {
        subjectGroups[subject] = [];
      }
      subjectGroups[subject].push(assignment);
    });

    for (const [subject, subjectAssignments] of Object.entries(subjectGroups)) {
      const subjectAssignmentIds = subjectAssignments.map(a => a._id);
      const submittedInSubject = await AssignmentSubmission.countDocuments({
        assignmentId: { $in: subjectAssignmentIds },
        studentId,
        status: 'submitted'
      });
      
      const gradedInSubject = await AssignmentSubmission.countDocuments({
        assignmentId: { $in: subjectAssignmentIds },
        studentId,
        status: 'graded'
      });

      const subjectGradedSubmissions = await AssignmentSubmission.find({
        assignmentId: { $in: subjectAssignmentIds },
        studentId,
        status: 'graded',
        grade: { $exists: true }
      }).populate('assignmentId', 'maxGrade');

      let subjectAverageGrade = 0;
      if (subjectGradedSubmissions.length > 0) {
        const totalGrade = subjectGradedSubmissions.reduce((sum, submission) => {
          const maxGrade = (submission.assignmentId as any)?.maxGrade || 100;
          return sum + (submission.grade || 0);
        }, 0);
        subjectAverageGrade = Math.round(totalGrade / subjectGradedSubmissions.length);
      }
      
      const completion = subjectAssignments.length > 0 
        ? Math.round((submittedInSubject / subjectAssignments.length) * 100)
        : 0;
      
      subjectStats[subject] = {
        completion,
        averageGrade: subjectAverageGrade,
        totalAssignments: subjectAssignments.length,
        submittedAssignments: submittedInSubject,
        gradedAssignments: gradedInSubject
      };
    }

    // Calculate overall performance
    const subjectAverages = Object.values(subjectStats).map(s => s.completion);
    const averageSubjectPerformance = subjectAverages.length > 0 
      ? subjectAverages.reduce((a, b) => a + b, 0) / subjectAverages.length 
      : 0;
    
    const overallPerformance = Math.round(
      (assignmentCompletion + goalsProgress + averageSubjectPerformance) / 3
    );

    // Generate monthly progress data
    const monthlyProgress = [];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'];
    
    for (let i = 0; i < 6; i++) {
      const startDate = new Date(2024, i, 1);
      const endDate = new Date(2024, i + 1, 0);
      
      const monthlyAssignments = await Assignment.countDocuments({
        studentId,
        createdAt: { $gte: startDate, $lte: endDate }
      });
      
      const monthlyGoals = await Goal.countDocuments({
        studentId,
        createdAt: { $gte: startDate, $lte: endDate }
      });
      
      monthlyProgress.push({
        month: months[i],
        assignments: monthlyAssignments,
        goals: monthlyGoals
      });
    }

    return NextResponse.json({
      assignmentCompletion,
      submittedAssignments,
      gradedAssignments,
      gradingRate,
      averageGrade,
      subjectStats,
      goalsProgress,
      overallPerformance,
      monthlyProgress
    });
  } catch (error) {
    console.error('Student analysis error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
