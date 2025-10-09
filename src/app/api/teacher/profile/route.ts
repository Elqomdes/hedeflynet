import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { IUser } from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(['teacher'])(request);
    if (!('user' in auth)) {
      return NextResponse.json({ message: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }
    const { user: authUser } = auth as { user: IUser };

    const { firstName, lastName, email, phone, address, currentPassword, newPassword } = await request.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ message: 'Ad, soyad ve e-posta gereklidir' }, { status: 400 });
    }

    await connectDB();

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(), 
      _id: { $ne: authUser._id } 
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Bu e-posta adresi zaten kullanılıyor' }, { status: 400 });
    }

    const updateData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '',
      address: address?.trim() || ''
    };

    // If password change is requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ message: 'Mevcut şifre gereklidir' }, { status: 400 });
      }

      const user = await User.findById(authUser._id);
      if (!user) {
        return NextResponse.json({ message: 'Kullanıcı bulunamadı' }, { status: 404 });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ message: 'Mevcut şifre yanlış' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ message: 'Yeni şifre en az 6 karakter olmalıdır' }, { status: 400 });
      }

      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    const updatedUser = await User.findByIdAndUpdate(
      authUser._id,
      updateData,
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return NextResponse.json({ message: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Profil başarıyla güncellendi',
      user: updatedUser 
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ message: 'Sunucu hatası' }, { status: 500 });
  }
}
