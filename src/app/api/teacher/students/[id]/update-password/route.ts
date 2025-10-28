import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { newPassword } = await request.json();
    
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    await connectDB();

    const studentId = params.id;

    // Check if student exists and belongs to this teacher
    const student = await User.findOne({ 
      _id: studentId, 
      role: 'student' 
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Öğrenci bulunamadı' },
        { status: 404 }
      );
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the student's password
    await User.findByIdAndUpdate(studentId, {
      password: hashedPassword,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Öğrenci şifresi başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
