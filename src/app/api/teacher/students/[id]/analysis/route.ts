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

    // Get assignment completion rate
    const totalAssignments = await Assignment.countDocuments({ studentId });
    const completedAssignments = await AssignmentSubmission.countDocuments({ 
      studentId, 
      status: 'completed' 
    });
    const assignmentCompletion = totalAssignments > 0 
      ? Math.round((completedAssignments / totalAssignments) * 100)
      : 0;

    // Get goals progress
    const totalGoals = await Goal.countDocuments({ studentId });
    const completedGoals = await Goal.countDocuments({ 
      studentId, 
      status: 'completed' 
    });
    const goalsProgress = totalGoals > 0 
      ? Math.round((completedGoals / totalGoals) * 100)
      : 0;

    // Get real subject statistics from assignments
    const subjectStats: { [key: string]: number } = {};
    const assignments = await Assignment.find({ studentId }).populate('classId', 'name');
    
    // Group assignments by subject (using class name as subject for now)
    const subjectGroups: { [key: string]: any[] } = {};
    assignments.forEach(assignment => {
      const subject = (assignment.classId as any)?.name || 'Genel';
      if (!subjectGroups[subject]) {
        subjectGroups[subject] = [];
      }
      subjectGroups[subject].push(assignment);
    });

    // Calculate average completion rate per subject
    for (const [subject, subjectAssignments] of Object.entries(subjectGroups)) {
      const subjectAssignmentIds = subjectAssignments.map(a => a._id);
      const completedInSubject = await AssignmentSubmission.countDocuments({
        assignmentId: { $in: subjectAssignmentIds },
        studentId,
        status: 'completed'
      });
      
      subjectStats[subject] = subjectAssignments.length > 0 
        ? Math.round((completedInSubject / subjectAssignments.length) * 100)
        : 0;
    }

    // If no subjects found, use default values
    if (Object.keys(subjectStats).length === 0) {
      subjectStats['Genel'] = assignmentCompletion;
    }

    // Calculate overall performance
    const subjectAverages = Object.values(subjectStats);
    const averageSubjectPerformance = subjectAverages.length > 0 
      ? subjectAverages.reduce((a, b) => a + b, 0) / subjectAverages.length 
      : 0;
    
    const overallPerformance = Math.round(
      (assignmentCompletion + goalsProgress + averageSubjectPerformance) / 3
    );

    // Generate real monthly progress data
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
      subjectStats,
      goalsProgress,
      overallPerformance,
      monthlyProgress
    });
  } catch (error) {
    console.error('Student analysis error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
