import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Bu endpoint sadece development ortamında kullanılabilir' },
      { status: 403 }
    );
  }

  try {
    await connectDB();

    // Admin kullanıcısı
    const admin = new User({
      username: 'admin',
      email: 'admin@hedefly.net',
      password: 'admin123',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      phone: '0555 000 00 01',
      isActive: true
    });

    // Öğretmen kullanıcısı
    const teacher = new User({
      username: 'ogretmen1',
      email: 'ogretmen@hedefly.net',
      password: 'ogretmen123',
      role: 'teacher',
      firstName: 'Ahmet',
      lastName: 'Öğretmen',
      phone: '0555 000 00 02',
      isActive: true
    });

    // Öğrenci kullanıcısı
    const student = new User({
      username: 'ogrenci1',
      email: 'ogrenci@hedefly.net',
      password: 'ogrenci123',
      role: 'student',
      firstName: 'Mehmet',
      lastName: 'Öğrenci',
      phone: '0555 000 00 03',
      isActive: true
    });

    // Kullanıcıları kaydet
    await admin.save();
    await teacher.save();
    await student.save();

    return NextResponse.json({
      message: 'Test kullanıcıları başarıyla oluşturuldu',
      users: [
        {
          role: 'admin',
          username: 'admin',
          password: 'admin123',
          email: 'admin@hedefly.net'
        },
        {
          role: 'teacher',
          username: 'ogretmen1',
          password: 'ogretmen123',
          email: 'ogretmen@hedefly.net'
        },
        {
          role: 'student',
          username: 'ogrenci1',
          password: 'ogrenci123',
          email: 'ogrenci@hedefly.net'
        }
      ]
    });
  } catch (error) {
    console.error('Test users creation error:', error);
    return NextResponse.json(
      { error: 'Test kullanıcıları oluşturulamadı' },
      { status: 500 }
    );
  }
}
