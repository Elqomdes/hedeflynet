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

    // Öğrencileri getir
    const students = await User.find({ role: 'student' }).lean();

    // Simüle edilmiş liderlik tablosu
    const leaderboard = students.map((student, index) => ({
      rank: index + 1,
      studentId: student._id.toString(),
      studentName: `${student.firstName} ${student.lastName}`,
      points: Math.floor(Math.random() * 2000) + 500, // 500-2500 arası puan
      level: Math.floor(Math.random() * 20) + 5, // 5-25 arası seviye
      badges: Math.floor(Math.random() * 8) + 1 // 1-8 arası rozet
    }));

    // Puanlara göre sırala
    leaderboard.sort((a, b) => b.points - a.points);

    // Sıralamayı güncelle
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return NextResponse.json({ data: leaderboard });

  } catch (error) {
    console.error('Get gamification leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
