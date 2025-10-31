import { Parent, ParentNotification } from '@/lib/models/Parent';
import connectDB from '@/lib/mongodb';

export interface NotificationData {
  parentId: string;
  studentId: string;
  type: 'assignment_completed' | 'assignment_graded' | 'goal_achieved' | 'low_performance' | 'attendance' | 'general';
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  data?: any;
}

/**
 * Create a notification for a parent
 */
export async function createParentNotification(notificationData: NotificationData) {
  try {
    await connectDB();

    const { parentId, studentId, type, title, message, priority = 'medium', data = {} } = notificationData;

    // Verify parent exists
    const parent = await Parent.findById(parentId);
    if (!parent) {
      console.error('Parent not found for notification:', parentId);
      return null;
    }

    // Create notification
    const notification = await ParentNotification.create({
      parentId,
      studentId,
      type,
      title,
      message,
      priority,
      data,
      isRead: false
    });

    return notification;
  } catch (error) {
    console.error('Error creating parent notification:', error);
    return null;
  }
}

/**
 * Create notifications for all parents of a student
 */
export async function createParentNotificationsForStudent(
  studentId: string,
  notificationData: Omit<NotificationData, 'parentId' | 'studentId'>
) {
  try {
    await connectDB();

    // Find all parents who have this student as a child
    const parents = await Parent.find({ 
      children: studentId,
      isActive: true 
    });

    const notifications = [];

    for (const parent of parents) {
      const notification = await createParentNotification({
        parentId: parent._id.toString(),
        studentId,
        ...notificationData
      });

      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  } catch (error) {
    console.error('Error creating parent notifications for student:', error);
    return [];
  }
}
