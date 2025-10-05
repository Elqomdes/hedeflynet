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

    // Simüle edilmiş sosyal öğrenme istatistikleri
    const stats = {
      totalPosts: 45,
      totalGroups: 8,
      activeUsers: Math.floor(totalStudents * 0.7), // %70 aktif
      totalInteractions: 234,
      mostActiveSubject: 'Matematik',
      recentActivity: 12,
      // Ek istatistikler
      totalStudents,
      thisWeekPosts: 8,
      thisMonthPosts: 32,
      averagePostsPerUser: 2.1,
      mostPopularGroup: 'Matematik Çalışma Grubu',
      engagementRate: 78, // %78 etkileşim oranı
      questionPosts: 18,
      discussionPosts: 15,
      resourcePosts: 12
    };

    return NextResponse.json({ data: stats });

  } catch (error) {
    console.error('Get social learning stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
