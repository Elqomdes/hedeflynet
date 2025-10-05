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

    // Simüle edilmiş video oturumları
    const sessions = [
      {
        id: 'session_1',
        title: 'Matematik Dersi - Fonksiyonlar',
        description: 'Fonksiyonlar konusunda detaylı anlatım ve soru çözümü',
        scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 gün sonra
        duration: 60,
        status: 'scheduled',
        participants: [
          { id: user.id, name: `${user.firstName} ${user.lastName}`, role: 'teacher', isActive: false },
          ...students.slice(0, 3).map(student => ({
            id: student._id.toString(),
            name: `${student.firstName} ${student.lastName}`,
            role: 'student' as const,
            isActive: false
          }))
        ],
        maxParticipants: 10,
        meetingUrl: 'https://meet.google.com/abc-defg-hij'
      },
      {
        id: 'session_2',
        title: 'Fizik Dersi - Hareket',
        description: 'Hareket konusunda temel kavramlar ve problem çözme teknikleri',
        scheduledFor: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 gün sonra
        duration: 90,
        status: 'scheduled',
        participants: [
          { id: user.id, name: `${user.firstName} ${user.lastName}`, role: 'teacher', isActive: false },
          ...students.slice(3, 6).map(student => ({
            id: student._id.toString(),
            name: `${student.firstName} ${student.lastName}`,
            role: 'student' as const,
            isActive: false
          }))
        ],
        maxParticipants: 15,
        meetingUrl: 'https://meet.google.com/xyz-1234-abc'
      },
      {
        id: 'session_3',
        title: 'Kimya Dersi - Atom Yapısı',
        description: 'Atom yapısı ve periyodik tablo konuları',
        scheduledFor: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 gün önce
        duration: 75,
        status: 'completed',
        participants: [
          { id: user.id, name: `${user.firstName} ${user.lastName}`, role: 'teacher', isActive: false },
          ...students.slice(0, 5).map(student => ({
            id: student._id.toString(),
            name: `${student.firstName} ${student.lastName}`,
            role: 'student' as const,
            isActive: false
          }))
        ],
        maxParticipants: 12,
        recordingUrl: 'https://drive.google.com/recording1.mp4'
      },
      {
        id: 'session_4',
        title: 'Biyoloji Dersi - Hücre',
        description: 'Hücre yapısı ve organelleri',
        scheduledFor: new Date().toISOString(), // Şimdi
        duration: 45,
        status: 'in_progress',
        participants: [
          { id: user.id, name: `${user.firstName} ${user.lastName}`, role: 'teacher', isActive: true },
          ...students.slice(0, 2).map(student => ({
            id: student._id.toString(),
            name: `${student.firstName} ${student.lastName}`,
            role: 'student' as const,
            isActive: true
          }))
        ],
        maxParticipants: 8,
        meetingUrl: 'https://meet.google.com/live-now-123'
      }
    ];

    return NextResponse.json({ data: sessions });

  } catch (error) {
    console.error('Get video sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, scheduledFor, duration, maxParticipants } = body;

    // Yeni oturum oluştur
    const newSession = {
      id: `session_${Date.now()}`,
      title,
      description,
      scheduledFor,
      duration: parseInt(duration),
      status: 'scheduled',
      participants: [
        { id: user.id, name: `${user.firstName} ${user.lastName}`, role: 'teacher', isActive: false }
      ],
      maxParticipants: parseInt(maxParticipants),
      meetingUrl: `https://meet.google.com/${Math.random().toString(36).substr(2, 9)}`
    };

    return NextResponse.json({ 
      success: true, 
      data: newSession,
      message: 'Video oturumu başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Create video session error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
