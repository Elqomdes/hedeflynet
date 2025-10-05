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

    // Simüle edilmiş adaptif öğrenme istatistikleri
    const stats = {
      totalModules: 6,
      activeModules: 5,
      enrolledStudents: Math.floor(totalStudents * 0.6), // %60 kayıtlı
      averageCompletionRate: 78,
      averageScore: 81,
      totalLearningHours: 45,
      topPerformingModule: 'Matematik - Fonksiyonlar',
      strugglingStudents: Math.floor(totalStudents * 0.15), // %15 zorlanan öğrenci
      // Ek istatistikler
      totalStudents,
      adaptiveModules: 3,
      regularModules: 3,
      thisWeekCompletions: 12,
      thisMonthCompletions: 48,
      averageTimePerModule: 75, // dakika
      mostPopularSubject: 'Matematik',
      leastPopularSubject: 'Türkçe',
      highPerformers: Math.floor(totalStudents * 0.25), // %25 yüksek performans
      mediumPerformers: Math.floor(totalStudents * 0.60), // %60 orta performans
      lowPerformers: Math.floor(totalStudents * 0.15) // %15 düşük performans
    };

    return NextResponse.json({ data: stats });

  } catch (error) {
    console.error('Get adaptive learning stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
