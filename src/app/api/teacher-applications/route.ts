import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { TeacherApplication } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, phone, experience, subjects, message } = await request.json();

    if (!firstName || !lastName || !email || !phone || !experience || !subjects) {
      return NextResponse.json(
        { error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if application already exists
    const existingApplication = await TeacherApplication.findOne({ email });
    if (existingApplication) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi ile zaten başvuru yapılmış' },
        { status: 400 }
      );
    }

    const application = new TeacherApplication({
      firstName,
      lastName,
      email,
      phone,
      experience,
      subjects: subjects.split(',').map((s: string) => s.trim()),
      message: message || '',
      status: 'pending'
    });

    await application.save();

    return NextResponse.json({
      message: 'Başvuru başarıyla gönderildi',
      applicationId: application._id
    });
  } catch (error) {
    console.error('Teacher application error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
