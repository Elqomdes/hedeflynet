import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { TeacherApplication, User } from '@/lib/models';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(['admin'])(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    await connectDB();

    const application = await TeacherApplication.findById(params.id);
    if (!application) {
      return NextResponse.json(
        { error: 'Başvuru bulunamadı' },
        { status: 404 }
      );
    }

    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'Bu başvuru zaten işlenmiş' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: application.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi ile zaten bir kullanıcı mevcut' },
        { status: 400 }
      );
    }

    // Create teacher user
    const baseUsername = `${application.firstName.toLowerCase()}.${application.lastName.toLowerCase()}`;
    let username = baseUsername;
    let counter = 1;
    
    // Ensure unique username
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    const teacher = new User({
      username,
      email: application.email,
      password: 'temp123', // Will be changed on first login
      role: 'teacher',
      firstName: application.firstName,
      lastName: application.lastName,
      phone: application.phone,
      isActive: true
    });

    await teacher.save();

    // Update application status
    application.status = 'approved';
    await application.save();

    return NextResponse.json({
      message: 'Başvuru onaylandı ve öğretmen hesabı oluşturuldu',
      teacherId: teacher._id,
      username: teacher.username
    });
  } catch (error) {
    console.error('Application approve error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
