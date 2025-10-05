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

    // Simüle edilmiş mobil istatistikleri
    const stats = {
      totalUsers: Math.floor(totalStudents * 0.8), // %80 mobil kullanıcı
      activeUsers: Math.floor(totalStudents * 0.6), // %60 aktif
      downloads: Math.floor(totalStudents * 1.2), // %120 indirme (bazıları birden fazla)
      notificationsSent: 156,
      averageSessionTime: 12, // dakika
      crashRate: 0.5, // %0.5
      appVersion: '3.4.0',
      lastUpdate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 hafta önce
      // Ek istatistikler
      totalStudents,
      thisWeekActiveUsers: Math.floor(totalStudents * 0.4),
      thisMonthActiveUsers: Math.floor(totalStudents * 0.6),
      averageDailyActiveUsers: Math.floor(totalStudents * 0.3),
      pushNotificationEnabled: Math.floor(totalStudents * 0.7),
      offlineModeUsers: Math.floor(totalStudents * 0.2),
      mostUsedFeature: 'Ödevler',
      averageAppRating: 4.6
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
