import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
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
    const teacher = await User.findById(params.id).select('-password').lean();
    if (!teacher || teacher.role !== 'teacher') {
      return NextResponse.json({ error: 'Öğretmen bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(teacher);
  } catch (error) {
    console.error('Teacher fetch error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function PUT(
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

    const { username, email, firstName, lastName, phone, isActive, password } = await request.json();

    await connectDB();

    const teacher = await User.findById(params.id);
    if (!teacher || teacher.role !== 'teacher') {
      return NextResponse.json({ error: 'Öğretmen bulunamadı' }, { status: 404 });
    }

    if (username !== undefined) teacher.username = username;
    if (email !== undefined) teacher.email = email;
    if (firstName !== undefined) teacher.firstName = firstName;
    if (lastName !== undefined) teacher.lastName = lastName;
    if (phone !== undefined) teacher.phone = phone;
    if (isActive !== undefined) teacher.isActive = isActive;
    if (password !== undefined && password.length >= 6) teacher.password = password;

    await teacher.save();

    const sanitized = teacher.toObject();
    delete (sanitized as any).password;
    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('Teacher update error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function DELETE(
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

    const teacher = await User.findById(params.id);
    if (!teacher || teacher.role !== 'teacher') {
      return NextResponse.json({ error: 'Öğretmen bulunamadı' }, { status: 404 });
    }

    await teacher.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Teacher delete error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}


