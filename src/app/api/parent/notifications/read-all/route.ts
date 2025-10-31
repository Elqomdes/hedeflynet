import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { Parent, ParentNotification } from '@/lib/models/Parent';

export async function PUT(request: NextRequest) {
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

    // Mark all notifications as read
    const result = await ParentNotification.updateMany(
      { parentId, isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error: any) {
    console.error('Mark all notifications as read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read', details: error.message },
      { status: 500 }
    );
  }
}
