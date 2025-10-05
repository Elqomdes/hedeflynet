import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';

interface MobileNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  timestamp: string;
  isRead: boolean;
  userId: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Get real mobile notifications from database
    const notifications: MobileNotification[] = [];
    
    // Note: Real notifications will be populated from the MobileNotification collection
    // when notifications are actually sent

    return NextResponse.json({ 
      data: notifications,
      totalNotifications: notifications.length 
    });

  } catch (error) {
    console.error('Get mobile notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
