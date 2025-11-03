import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await User.findById(user._id).lean();
    if (!dbUser) {
      return NextResponse.json({ error: 'Profil bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({
      _id: dbUser._id,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      email: dbUser.email,
      phone: dbUser.phone || '',
      createdAt: dbUser.createdAt,
    });
  } catch (error) {
    console.error('Student profile GET error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const update: Record<string, any> = {};

    if (typeof body.firstName === 'string' && body.firstName.trim().length > 0 && body.firstName.trim().length <= 50) {
      update.firstName = body.firstName.trim();
    }
    if (typeof body.lastName === 'string' && body.lastName.trim().length > 0 && body.lastName.trim().length <= 50) {
      update.lastName = body.lastName.trim();
    }
    if (typeof body.phone === 'string') {
      update.phone = body.phone.trim();
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek alan bulunamadı' }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(user._id, { $set: update }, { new: true }).lean();
    if (!updated) {
      return NextResponse.json({ error: 'Profil güncellenemedi' }, { status: 404 });
    }

    return NextResponse.json({
      _id: updated._id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      phone: updated.phone || '',
      createdAt: updated.createdAt,
    });
  } catch (error) {
    console.error('Student profile PUT error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}


