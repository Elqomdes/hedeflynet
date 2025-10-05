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

    // Simüle edilmiş push bildirimleri
    const notifications = [
      {
        id: 'notif_1',
        title: 'Yeni Ödev Eklendi',
        message: 'Matematik dersinde yeni bir ödev verildi. Son teslim tarihi: 15 Aralık',
        type: 'assignment',
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 saat önce
        readCount: Math.floor(totalStudents * 0.8),
        totalSent: totalStudents
      },
      {
        id: 'notif_2',
        title: 'Hedef Hatırlatması',
        message: 'Bu hafta hedeflerinizi tamamlamak için son 2 gününüz kaldı!',
        type: 'reminder',
        sentAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 saat önce
        readCount: Math.floor(totalStudents * 0.6),
        totalSent: totalStudents
      },
      {
        id: 'notif_3',
        title: 'Tebrikler! 🎉',
        message: 'Matematik Ustası rozetini kazandınız! Harika bir başarı.',
        type: 'achievement',
        sentAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 saat önce
        readCount: Math.floor(totalStudents * 0.9),
        totalSent: Math.floor(totalStudents * 0.3)
      },
      {
        id: 'notif_4',
        title: 'Sistem Bakımı',
        message: 'Yarın 02:00-04:00 saatleri arasında sistem bakımı yapılacaktır.',
        type: 'general',
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 gün önce
        readCount: Math.floor(totalStudents * 0.7),
        totalSent: totalStudents
      },
      {
        id: 'notif_5',
        title: 'Video Koçluk Oturumu',
        message: 'Yarın saat 14:00\'da matematik video koçluk oturumu başlayacak.',
        type: 'reminder',
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 gün önce
        readCount: Math.floor(totalStudents * 0.5),
        totalSent: Math.floor(totalStudents * 0.4)
      },
      {
        id: 'notif_6',
        title: 'Yeni Özellik: AI Koçluk',
        message: 'Artık AI destekli kişiselleştirilmiş öneriler alabilirsiniz!',
        type: 'general',
        sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 gün önce
        readCount: Math.floor(totalStudents * 0.85),
        totalSent: totalStudents
      }
    ];

    // Tarihe göre sırala (en yeni önce)
    notifications.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    return NextResponse.json({ data: notifications });

  } catch (error) {
    console.error('Get mobile notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
