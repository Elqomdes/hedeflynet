import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Class } from '@/lib/models';
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

    // Check if teacher exists
    const teacher = await User.findById(teacherId);
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

    // Get teacher's classes
    const classes = await Class.find({
      $or: [
        { teacherId },
        { coTeachers: teacherId }
      ]
    })
    .select('_id name description students createdAt')
    .lean();

    // Add student count to each class
    const classesWithCount = classes.map(cls => ({
      ...cls,
      studentCount: Array.isArray((cls as any).students) ? (cls as any).students.length : 0
    }));

    return NextResponse.json({
      success: true,
      classes: classesWithCount
    });

  } catch (error) {
    console.error('Get teacher classes error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
