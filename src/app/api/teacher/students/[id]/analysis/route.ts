import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Assignment, AssignmentSubmission } from '@/lib/models';
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
    const completedAssignments = await AssignmentSubmission.countDocuments({ 
      studentId, 
      status: 'completed' 
    });
    
    let assignmentCompletion = totalAssignments > 0 
      ? Math.round((submittedAssignments / totalAssignments) * 100)
      : 0;
    assignmentCompletion = Math.max(0, Math.min(100, assignmentCompletion));
    
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

    // Goals are not used in this analysis anymore

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

    // Calculate average completion rate and grade per subject
    const subjectDetails: { [key: string]: { completion: number; averageGrade: number; totalAssignments: number; submittedAssignments: number; gradedAssignments: number } } = {};
    
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

      // Get average grade for this subject
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
      
      subjectStats[subject] = completion;
      subjectDetails[subject] = {
        completion,
        averageGrade: subjectAverageGrade,
        totalAssignments: subjectAssignments.length,
        submittedAssignments: submittedInSubject,
        gradedAssignments: gradedInSubject
      };
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
      (assignmentCompletion + averageSubjectPerformance) / 2
    );

    // Generate weekly assignment data for current week
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    // Get assignments for current week
    const weeklyAssignments = await Assignment.find({
      studentId,
      createdAt: { $gte: startOfWeek, $lte: endOfWeek }
    });

    // Get submissions for weekly assignments
    const weeklyAssignmentIds = weeklyAssignments.map(a => a._id);
    const weeklySubmissions = await AssignmentSubmission.find({
      assignmentId: { $in: weeklyAssignmentIds },
      studentId,
      status: 'submitted'
    });

    const weeklyGradedSubmissions = await AssignmentSubmission.find({
      assignmentId: { $in: weeklyAssignmentIds },
      studentId,
      status: 'graded'
    });

    // Calculate weekly statistics
    const weeklyStats = {
      totalAssignments: weeklyAssignments.length,
      submittedAssignments: weeklySubmissions.length,
      gradedAssignments: weeklyGradedSubmissions.length,
      pendingAssignments: weeklyAssignments.length - weeklySubmissions.length,
      weekStart: startOfWeek.toLocaleDateString('tr-TR'),
      weekEnd: endOfWeek.toLocaleDateString('tr-TR')
    };

    // Generate monthly progress data (last 6 months, dynamic)
    const monthlyProgress = [] as any[];
    const base = new Date();
    base.setDate(1);
    for (let i = 5; i >= 0; i--) {
      const startDate = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const endDate = new Date(base.getFullYear(), base.getMonth() - i + 1, 0);
      const label = startDate.toLocaleString('tr-TR', { month: 'short' });

      const monthlyAssignments = await Assignment.countDocuments({
        studentId,
        createdAt: { $gte: startDate, $lte: endDate }
      });

      monthlyProgress.push({
        month: label,
        assignments: monthlyAssignments
      });
    }

    // Build assignment title counts for bar chart
    const titleGroups = await Assignment.aggregate([
      { $match: { studentId } },
      { $group: { _id: '$title', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Ensure we have valid title data
    let assignmentTitleCounts = titleGroups
      .filter(item => item._id && item._id.trim().length > 0)
      .map(item => ({ 
        title: item._id.trim(), 
        count: item.count 
      }));

    // If no specific titles found, try to get actual assignment titles
    if (assignmentTitleCounts.length === 0 && totalAssignments > 0) {
      // Get actual assignment titles from database
      const actualAssignments = await Assignment.find({ studentId })
        .select('title')
        .lean();
      
      const titleCounts: { [key: string]: number } = {};
      actualAssignments.forEach(assignment => {
        if (assignment.title && assignment.title.trim().length > 0) {
          const cleanTitle = assignment.title.trim();
          titleCounts[cleanTitle] = (titleCounts[cleanTitle] || 0) + 1;
        }
      });
      
      assignmentTitleCounts = Object.entries(titleCounts)
        .map(([title, count]) => ({ title, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // If still no valid titles, show individual assignments by ID
      if (assignmentTitleCounts.length === 0) {
        assignmentTitleCounts = actualAssignments
          .filter(assignment => assignment.title)
          .slice(0, 10)
          .map((assignment, index) => ({
            title: assignment.title.trim() || `Ödev ${index + 1}`,
            count: 1
          }));
      }
    }

    return NextResponse.json({
      assignmentCompletion,
      totalAssignments,
      submittedAssignments,
      gradedAssignments,
      gradingRate,
      averageGrade,
      subjectStats,
      subjectDetails,
      overallPerformance,
      monthlyProgress,
      assignmentTitleCounts,
      weeklyStats
    });
  } catch (error) {
    console.error('Student analysis error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
