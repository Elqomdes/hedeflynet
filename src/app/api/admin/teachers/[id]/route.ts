import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { requireAuth, getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const connection = await connectDB();
    if (!connection) {
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı' },
        { status: 500 }
      );
    }

    const teacherId = params.id;

    // Get teacher details
    const teacher = await User.findById(teacherId)
      .select('_id username email firstName lastName phone isActive createdAt lastLogin')
      .lean();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Öğretmen bulunamadı' },
        { status: 404 }
      );
    }

    if (teacher.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Bu kullanıcı bir öğretmen değil' },
        { status: 400 }
      );
    }

    return NextResponse.json(teacher);

  } catch (error) {
    console.error('Get teacher details error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
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

    await connectDB();

    const teacherId = params.id;
    const body = await request.json();

    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return NextResponse.json({ error: 'Öğretmen bulunamadı' }, { status: 404 });
    }
    if (teacher.role !== 'teacher') {
      return NextResponse.json({ error: 'Bu kullanıcı öğretmen değil' }, { status: 400 });
    }

    // Update allowed fields
    const allowed: Array<keyof typeof body> = ['username', 'email', 'firstName', 'lastName', 'phone', 'password'];
    for (const key of allowed) {
      if (key in body && typeof body[key] !== 'undefined') {
        (teacher as any)[key] = body[key];
      }
    }
    await teacher.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update teacher error:', error);
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
    if (!teacher) {
      return NextResponse.json({ error: 'Öğretmen bulunamadı' }, { status: 404 });
    }
    if (teacher.role !== 'teacher') {
      return NextResponse.json({ error: 'Bu kullanıcı öğretmen değil' }, { status: 400 });
    }

    await User.deleteOne({ _id: params.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete teacher error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}