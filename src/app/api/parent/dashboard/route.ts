import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentParent } from '@/lib/auth';
import { User, Assignment, AssignmentSubmission } from '@/lib/models';
import { VideoSession } from '@/lib/models/VideoCoaching';
import { Parent, ParentNotification, ParentReport } from '@/lib/models/Parent';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get current parent directly
    const parent = await getCurrentParent(request);
    if (!parent) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const parentId = parent._id.toString();
    console.log('Getting dashboard for parent:', parentId, 'with', parent.children.length, 'children');

    // Get children details
    const children = await User.find({
      _id: { $in: parent.children },
      role: 'student'
    }).select('_id firstName lastName email classId').lean();

    console.log('Found children:', children.length);

    const childrenWithDetails = await Promise.all(
      children.map(async (child) => {
        const { Class } = await import('@/lib/models');
        let className = '';
        if (child.classId) {
          const classDoc = await Class.findById(child.classId).select('name').lean();
          className = classDoc?.name || '';
        }
        return {
          id: child._id.toString(),
          firstName: child.firstName,
          lastName: child.lastName,
          className: className
        };
      })
    );

    // Get notifications
    const notifications = await ParentNotification.find({ parentId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    const unreadCount = await ParentNotification.countDocuments({ 
      parentId, 
      isRead: false 
    });

    // Get children stats
    const childrenStats = await Promise.all(
      parent.children.map(async (childId: any) => {
        const student = await User.findById(childId);
        if (!student) return null;

        const submissions = await AssignmentSubmission.find({ studentId: childId.toString() });
        const assignments = await Assignment.find({
          $or: [
            { studentId: childId.toString() },
            { students: childId }
          ]
        });
        const videoSessions = await VideoSession.find({ studentId: childId.toString() });

        const assignmentsCompleted = submissions.filter(s => s.status === 'submitted').length;
        const assignmentsTotal = assignments.length;
        const averageGrade = submissions.length > 0 
          ? submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / submissions.length 
          : 0;
        const completedSessions = videoSessions.filter(v => v.status === 'completed').length;
        const totalSessions = videoSessions.length;

        return {
          studentId: childId.toString(),
          studentName: `${student.firstName} ${student.lastName}`,
          assignmentsCompleted,
          assignmentsTotal,
          averageGrade: Math.round(averageGrade),
          completedSessions,
          totalSessions,
          lastActivity: student.updatedAt || student.createdAt,
          performanceTrend: averageGrade >= 80 ? 'improving' : 
                           averageGrade >= 60 ? 'stable' : 'declining'
        };
      })
    );

    const validChildrenStats = childrenStats.filter(stat => stat !== null);

    // Get recent reports
    const recentReports = await ParentReport.find({ parentId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get upcoming events (simplified)
    const upcomingEvents = parent.children.map((childId: any) => {
      const child = children.find(c => c._id.toString() === childId.toString());
      if (!child) return null;
      return {
        type: 'assignment_due' as const,
        title: 'Yaklaşan Ödev',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        studentId: childId.toString(),
        studentName: `${child.firstName} ${child.lastName}`
      };
    }).filter((e: any) => e !== null);

    const dashboardData = {
      parent: {
        id: parent._id.toString(),
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email
      },
      children: childrenWithDetails,
      notifications: {
        unread: unreadCount
      },
      stats: validChildrenStats.map(stat => ({
        studentId: stat.studentId,
        studentName: stat.studentName,
        totalAssignments: stat.assignmentsTotal,
        completedAssignments: stat.assignmentsCompleted,
        averageGrade: stat.averageGrade,
        completedSessions: stat.completedSessions,
        totalSessions: stat.totalSessions,
        lastActivity: stat.lastActivity,
        performanceTrend: stat.performanceTrend
      })),
      recentReports,
      upcomingEvents
    };

    console.log('Dashboard data prepared successfully');

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Parent dashboard error:', error);
    return NextResponse.json(
      { 
        error: 'Dashboard verileri alınamadı',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}
