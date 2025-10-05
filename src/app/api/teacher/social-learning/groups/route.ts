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

    // Simüle edilmiş çalışma grupları
    const groups = [
      {
        id: 'group_1',
        name: 'Matematik Çalışma Grubu',
        description: 'Fonksiyonlar ve türev konularında birlikte çalışıyoruz',
        subject: 'Matematik',
        memberCount: Math.floor(totalStudents * 0.3),
        maxMembers: 15,
        isActive: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'group_2',
        name: 'Fizik Problem Çözme',
        description: 'Hareket ve kuvvet problemlerini birlikte çözüyoruz',
        subject: 'Fizik',
        memberCount: Math.floor(totalStudents * 0.2),
        maxMembers: 12,
        isActive: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'group_3',
        name: 'Kimya Laboratuvar',
        description: 'Kimyasal reaksiyonları ve deneyleri tartışıyoruz',
        subject: 'Kimya',
        memberCount: Math.floor(totalStudents * 0.25),
        maxMembers: 10,
        isActive: true,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'group_4',
        name: 'Biyoloji Hücre Araştırması',
        description: 'Hücre yapısı ve organelleri üzerine araştırma yapıyoruz',
        subject: 'Biyoloji',
        memberCount: Math.floor(totalStudents * 0.15),
        maxMembers: 8,
        isActive: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'group_5',
        name: 'Tarih Osmanlı Dönemi',
        description: 'Osmanlı İmparatorluğu dönemini detaylı inceliyoruz',
        subject: 'Tarih',
        memberCount: Math.floor(totalStudents * 0.18),
        maxMembers: 12,
        isActive: false,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'group_6',
        name: 'Türkçe Kompozisyon',
        description: 'Kompozisyon yazma teknikleri ve uygulamaları',
        subject: 'Türkçe',
        memberCount: Math.floor(totalStudents * 0.12),
        maxMembers: 10,
        isActive: true,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    return NextResponse.json({ data: groups });

  } catch (error) {
    console.error('Get social learning groups error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
