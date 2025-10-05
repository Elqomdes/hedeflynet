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

    // Simüle edilmiş gamification istatistikleri
    const stats = {
      totalPoints: 15420,
      totalBadges: 8,
      activeStudents: Math.floor(totalStudents * 0.85), // %85 aktif
      averageLevel: 12,
      topPerformer: 'Ahmet Yılmaz',
      recentAchievements: 23,
      leaderboardPosition: 1,
      // Ek istatistikler
      totalStudents,
      thisWeekPoints: 1250,
      thisMonthPoints: 4800,
      mostPopularBadge: 'Matematik Ustası',
      averagePointsPerStudent: Math.floor(15420 / totalStudents),
      highPerformers: Math.floor(totalStudents * 0.2), // %20 yüksek performans
      mediumPerformers: Math.floor(totalStudents * 0.6), // %60 orta performans
      lowPerformers: Math.floor(totalStudents * 0.2) // %20 düşük performans
    };

    return NextResponse.json({ data: stats });

  } catch (error) {
    console.error('Get gamification stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
