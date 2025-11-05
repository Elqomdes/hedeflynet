import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Assignment, AssignmentSubmission, User } from '@/lib/models';
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

    // Fetch student to determine class assignments as well
    const student = await User.findById(studentId).select('_id classId createdAt').lean();
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const assignmentMatch: any = { $or: [ { studentId } ] };
    if (student.classId) {
      assignmentMatch.$or.push({ classId: student.classId });
    }

    // Get assignment statistics
    const totalAssignments = await Assignment.countDocuments(assignmentMatch);
    const submittedAssignments = await AssignmentSubmission.countDocuments({ 
      studentId, 
      status: { $in: ['submitted', 'graded', 'completed'] }
    });
    const gradedAssignments = await AssignmentSubmission.countDocuments({ 
      studentId, 
      status: { $in: ['graded', 'completed'] }
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
      status: { $in: ['graded', 'completed'] },
      grade: { $exists: true, $ne: null }
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
    const assignments = await Assignment.find(assignmentMatch).populate('classId', 'name');
    
    // Group assignments by subject (using class name as subject for now)
    // Filter out 'deneme' subjects - only show 'Genel'
    const subjectGroups: { [key: string]: any[] } = {};
    assignments.forEach(assignment => {
      const subject = (assignment.classId as any)?.name || 'Genel';
      // Skip 'deneme' subjects
      if (subject && subject.toLowerCase() === 'deneme') {
        return;
      }
      if (!subjectGroups[subject]) {
        subjectGroups[subject] = [];
      }
      subjectGroups[subject].push(assignment);
    });
    
    // If no valid subjects found after filtering, use Genel
    if (Object.keys(subjectGroups).length === 0) {
      subjectGroups['Genel'] = assignments;
    }

    // Calculate average completion rate and grade per subject
    const subjectDetails: { [key: string]: { completion: number; averageGrade: number; totalAssignments: number; submittedAssignments: number; gradedAssignments: number } } = {};
    
    for (const [subject, subjectAssignments] of Object.entries(subjectGroups)) {
      const subjectAssignmentIds = subjectAssignments.map(a => a._id);
      const submittedInSubject = await AssignmentSubmission.countDocuments({
        assignmentId: { $in: subjectAssignmentIds },
        studentId,
        status: { $in: ['submitted', 'graded', 'completed'] }
      });
      
      const gradedInSubject = await AssignmentSubmission.countDocuments({
        assignmentId: { $in: subjectAssignmentIds },
        studentId,
        status: { $in: ['graded', 'completed'] }
      });

      // Get average grade for this subject
      const subjectGradedSubmissions = await AssignmentSubmission.find({
        assignmentId: { $in: subjectAssignmentIds },
        studentId,
        status: { $in: ['graded', 'completed'] },
        grade: { $exists: true, $ne: null }
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

    // Get assignments for current week - include assignments due in this week, not just created
    const weeklyAssignmentsAll = await Assignment.find({
      ...assignmentMatch,
      $or: [
        { createdAt: { $gte: startOfWeek, $lte: endOfWeek } },
        { dueDate: { $gte: startOfWeek, $lte: endOfWeek } }
      ]
    });

    // If the assignment is a class assignment, exclude ones that were created/published
    // before the student account was created (i.e., before joining). This prevents
    // showing pending tasks for newly added students with no assigned homework.
    const weeklyAssignments = weeklyAssignmentsAll.filter((a: any) => {
      // Always include directly assigned (individual) assignments
      if (a.studentId) return true;
      // For class assignments, only include if assigned after student creation
      if (a.classId) {
        const assignedAt: Date = (a.publishAt as Date) || (a.createdAt as Date);
        const studentCreatedAt: Date | undefined = (student as any)?.createdAt as Date | undefined;
        if (!assignedAt || !studentCreatedAt) return true;
        return assignedAt >= studentCreatedAt;
      }
      return true;
    });

    // Build set of weekly assignment ids
    const weeklyAssignmentIds = new Set<string>(
      weeklyAssignments.map((a: any) => String((a as any)._id))
    );

    // Fetch this student's submissions for those assignments (regardless of when submitted)
    const submissionsForWeeklyAssignments = await AssignmentSubmission.find({
      studentId,
      assignmentId: { $in: Array.from(weeklyAssignmentIds) }
    });

    // Count submitted (including late/graded/completed) - unique by assignmentId
    const submittedAssignmentIds = new Set<string>(
      (submissionsForWeeklyAssignments as any[])
        .filter(s => ['submitted', 'graded', 'completed', 'late'].includes(s.status))
        .map(s => s.assignmentId)
        .filter(Boolean)
        .map((id: any) => String(id))
    );
    const weeklyAllSubmitted = submittedAssignmentIds.size;

    // Count graded (unique by assignmentId)
    const gradedAssignmentIds = new Set<string>(
      (submissionsForWeeklyAssignments as any[])
        .filter(s => ['graded', 'completed'].includes(s.status))
        .map(s => s.assignmentId)
        .filter(Boolean)
        .map((id: any) => String(id))
    );
    const weeklyGradedSubmissions = gradedAssignmentIds.size;

    // Calculate weekly statistics from weekly assignment set
    const totalWeeklyAssignments = weeklyAssignmentIds.size;
    const weeklyStats = {
      totalAssignments: totalWeeklyAssignments,
      submittedAssignments: weeklyAllSubmitted,
      gradedAssignments: weeklyGradedSubmissions,
      pendingAssignments: Math.max(0, totalWeeklyAssignments - weeklyAllSubmitted),
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

      const monthlyAssignments = await Assignment.find({
        ...assignmentMatch,
        createdAt: { $gte: startDate, $lte: endDate }
      });

      const monthlyAssignmentIds = monthlyAssignments.map(a => a._id);
      const monthlySubmitted = await AssignmentSubmission.countDocuments({
        assignmentId: { $in: monthlyAssignmentIds },
        studentId,
        status: { $in: ['submitted', 'graded', 'completed', 'late'] }
      });

      monthlyProgress.push({
        month: label,
        assignments: monthlyAssignments.length,
        pending: Math.max(0, monthlyAssignments.length - monthlySubmitted)
      });
    }

    // Build assignment title counts for bar chart
    const titleMatch: any = { $or: [ { studentId } ] };
    if (student.classId) {
      titleMatch.$or.push({ classId: student.classId });
    }

    const titleGroups = await Assignment.aggregate([
      { $match: titleMatch },
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
      const actualAssignments = await Assignment.find(titleMatch)
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
