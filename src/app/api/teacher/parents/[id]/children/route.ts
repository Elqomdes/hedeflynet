import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Parent } from '@/lib/models';
import User from '@/lib/models/User';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const AddChildSchema = z.object({
  studentId: z.string().min(1, 'Öğrenci ID gereklidir')
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request data
    const body = await request.json();
    const parsed = AddChildSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Geçersiz giriş verileri', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { studentId } = parsed.data;

    // Connect to MongoDB
    const connection = await connectDB();
    if (!connection) {
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı' },
        { status: 500 }
      );
    }

    const parentId = params.id;

    // Check if parent exists
    const parent = await Parent.findById(parentId);
    if (!parent) {
      return NextResponse.json(
        { error: 'Veli bulunamadı' },
        { status: 404 }
      );
    }

    // Check if student exists
    const student = await User.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { error: 'Öğrenci bulunamadı' },
        { status: 404 }
      );
    }

    if (student.role !== 'student') {
      return NextResponse.json(
        { error: 'Bu kullanıcı bir öğrenci değil' },
        { status: 400 }
      );
    }

    // Check if student is already added to this parent
    if (parent.children && parent.children.includes(studentId as any)) {
      return NextResponse.json(
        { error: 'Bu öğrenci zaten veliye eklenmiş' },
        { status: 400 }
      );
    }

    // Add student to parent's children array
    if (!parent.children) {
      parent.children = [];
    }
    parent.children.push(studentId as any);
    await parent.save();

    return NextResponse.json({
      success: true,
      message: 'Öğrenci veliye başarıyla eklendi'
    });

  } catch (error) {
    console.error('Add child to parent error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Öğrenci ID gereklidir' },
        { status: 400 }
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

    const parentId = params.id;

    // Check if parent exists
    const parent = await Parent.findById(parentId);
    if (!parent) {
      return NextResponse.json(
        { error: 'Veli bulunamadı' },
        { status: 404 }
      );
    }

    // Remove student from parent's children array
    if (parent.children) {
      parent.children = parent.children.filter((id: any) => id.toString() !== studentId);
    }
    await parent.save();

    return NextResponse.json({
      success: true,
      message: 'Öğrenci veliden başarıyla çıkarıldı'
    });

  } catch (error) {
    console.error('Remove child from parent error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
