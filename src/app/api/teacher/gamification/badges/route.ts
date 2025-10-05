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

    // Simüle edilmiş rozetler
    const badges = [
      {
        id: 'badge_1',
        name: 'Matematik Ustası',
        description: '10 matematik ödevini başarıyla tamamla',
        icon: '🧮',
        points: 100,
        category: 'academic',
        earnedBy: Math.floor(totalStudents * 0.7),
        totalStudents
      },
      {
        id: 'badge_2',
        name: 'Sosyal Kelebek',
        description: '5 farklı öğrenciyle etkileşim kur',
        icon: '🦋',
        points: 50,
        category: 'social',
        earnedBy: Math.floor(totalStudents * 0.4),
        totalStudents
      },
      {
        id: 'badge_3',
        name: 'Seri Çalışkan',
        description: '7 gün üst üste giriş yap',
        icon: '🔥',
        points: 75,
        category: 'streak',
        earnedBy: Math.floor(totalStudents * 0.3),
        totalStudents
      },
      {
        id: 'badge_4',
        name: 'Mükemmeliyetçi',
        description: '5 ödevde 100 puan al',
        icon: '⭐',
        points: 150,
        category: 'academic',
        earnedBy: Math.floor(totalStudents * 0.2),
        totalStudents
      },
      {
        id: 'badge_5',
        name: 'Yardımsever',
        description: '10 soruya cevap ver',
        icon: '🤝',
        points: 60,
        category: 'social',
        earnedBy: Math.floor(totalStudents * 0.5),
        totalStudents
      },
      {
        id: 'badge_6',
        name: 'Hızlı Öğrenci',
        description: '1 günde 3 modül tamamla',
        icon: '⚡',
        points: 80,
        category: 'special',
        earnedBy: Math.floor(totalStudents * 0.15),
        totalStudents
      },
      {
        id: 'badge_7',
        name: 'Sabırlı',
        description: '30 gün üst üste giriş yap',
        icon: '🌱',
        points: 200,
        category: 'streak',
        earnedBy: Math.floor(totalStudents * 0.1),
        totalStudents
      },
      {
        id: 'badge_8',
        name: 'Lider',
        description: 'Liderlik tablosunda ilk 3\'e gir',
        icon: '👑',
        points: 300,
        category: 'special',
        earnedBy: Math.floor(totalStudents * 0.05),
        totalStudents
      }
    ];

    return NextResponse.json({ data: badges });

  } catch (error) {
    console.error('Get gamification badges error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
