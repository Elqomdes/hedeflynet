import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Parent, ParentNotification } from '@/lib/models/Parent';

/**
 * Helper function to create notifications
 * This endpoint can be called internally by other services
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { parentId, studentId, type, title, message, priority = 'medium', data = {} } = body;

    if (!parentId || !studentId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: parentId, studentId, type, title, message' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = ['assignment_completed', 'assignment_graded', 'goal_achieved', 'low_performance', 'attendance', 'general'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify parent exists
    const parent = await Parent.findById(parentId);
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    // Create notification
    const notification = new ParentNotification({
      parentId,
      studentId,
      type,
      title,
      message,
      priority,
      data,
      isRead: false
    });

    await notification.save();

    return NextResponse.json({
      success: true,
      data: {
        id: notification._id.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt
      }
    });
  } catch (error: any) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Failed to create notification', details: error.message },
      { status: 500 }
    );
  }
}

