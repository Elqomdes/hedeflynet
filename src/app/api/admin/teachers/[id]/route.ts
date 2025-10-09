import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getCurrentUser } from '@/lib/auth';

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