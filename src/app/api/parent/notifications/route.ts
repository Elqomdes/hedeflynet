import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { Parent, ParentNotification } from '@/lib/models/Parent';
import { User } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get parent from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(sessionCookie.value);
    const parentId = sessionData.userId;
    const userRole = sessionData.role;

    if (userRole !== 'parent') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find parent
    const parent = await Parent.findById(parentId);
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    // Get notifications with student info
    const notifications = await ParentNotification.find({ parentId })
      .sort({ createdAt: -1 })
      .populate('studentId', 'firstName lastName')
      .lean();

    // Format notifications
    const formattedNotifications = notifications.map((notif: any) => ({
      id: notif._id.toString(),
      title: notif.title,
      message: notif.message,
      type: mapNotificationType(notif.type),
      date: notif.createdAt,
      isRead: notif.isRead,
      priority: notif.priority,
      studentName: notif.studentId ? `${notif.studentId.firstName} ${notif.studentId.lastName}` : '',
      data: notif.data || {}
    }));

    // Get unread count
    const unreadCount = await ParentNotification.countDocuments({ parentId, isRead: false });

    return NextResponse.json({
      success: true,
      data: {
        notifications: formattedNotifications,
        unreadCount
      }
    });
  } catch (error: any) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error.message },
      { status: 500 }
    );
  }
}

function mapNotificationType(type: string): 'success' | 'warning' | 'info' {
  switch (type) {
    case 'assignment_completed':
    case 'assignment_graded':
    case 'goal_achieved':
      return 'success';
    case 'low_performance':
    case 'attendance':
      return 'warning';
    default:
      return 'info';
  }
}
