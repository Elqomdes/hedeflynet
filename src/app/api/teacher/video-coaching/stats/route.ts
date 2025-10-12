import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';

export const dynamic = 'force-dynamic';

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

    // Simüle edilmiş video istatistikleri
    const stats = {
      totalSessions: 12,
      completedSessions: 8,
      upcomingSessions: 3,
      totalParticipants: totalStudents * 2, // Öğrenci başına ortalama 2 katılım
      averageDuration: 65, // dakika
      totalRecordings: 6,
      // Ek istatistikler
      totalStudents,
      thisWeekSessions: 4,
      thisMonthSessions: 12,
      averageParticipantsPerSession: Math.round(totalStudents * 0.4), // %40 katılım oranı
      totalHours: 13, // toplam saat
      mostPopularSubject: 'Matematik',
      attendanceRate: 85 // %85 katılım oranı
    };

    return NextResponse.json({ data: stats });

  } catch (error) {
    console.error('Get video coaching stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
