import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';

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

    // Öğrenci sayısı
    const totalStudents = await User.countDocuments({ role: 'student' });

    // Get real mobile statistics
    const stats = {
      totalUsers: 0, // Will be calculated from actual mobile users
      activeUsers: 0, // Will be calculated from actual active users
      downloads: 0, // Will be calculated from actual downloads
      notificationsSent: 0, // Will be calculated from actual notifications
      averageSessionTime: 0, // Will be calculated from actual session data
      crashRate: 0, // Will be calculated from actual crash data
      appVersion: '1.0.0', // Default version
      lastUpdate: new Date().toISOString(), // Current date
      // Additional statistics
      totalStudents,
      thisWeekActiveUsers: 0, // Will be calculated from actual data
      thisMonthActiveUsers: 0, // Will be calculated from actual data
      averageDailyActiveUsers: 0, // Will be calculated from actual data
      pushNotificationEnabled: 0, // Will be calculated from actual settings
      offlineModeUsers: 0, // Will be calculated from actual usage
      mostUsedFeature: 'Henüz veri yok',
      averageAppRating: 0 // Will be calculated from actual ratings
    };

    return NextResponse.json({ data: stats });

  } catch (error) {
    console.error('Get mobile stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
