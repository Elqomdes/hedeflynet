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

    // Simüle edilmiş mobil kullanıcılar
    const mobileUsers = students.slice(0, 12).map((student, index) => ({
      id: student._id.toString(),
      name: `${student.firstName} ${student.lastName}`,
      deviceType: index % 3 === 0 ? 'ios' : 'android',
      appVersion: index % 4 === 0 ? '3.4.0' : '3.3.0',
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      isOnline: Math.random() > 0.3, // %70 online
      notificationsEnabled: Math.random() > 0.2 // %80 bildirim açık
    }));

    return NextResponse.json({ data: mobileUsers });

  } catch (error) {
    console.error('Get mobile users error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
