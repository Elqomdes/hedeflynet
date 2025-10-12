import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Class from '@/lib/models/Class';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
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

    const teacherId = authResult._id;
    const studentId = params.id;

    // Connect to MongoDB
    const connection = await connectDB();
    if (!connection) {
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı' },
        { status: 500 }
      );
    }

    // Get student details
    const student = await User.findById(studentId)
      .select('-password')
      .lean();

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

    // Check if student belongs to teacher's classes
    const classes = await Class.find({
      $or: [
        { teacherId },
        { coTeachers: teacherId }
      ],
      students: studentId
    }).select('name').lean();

    // Add class information to student
    const studentWithClass = {
      ...student,
      className: classes.length > 0 ? classes[0].name : null
    };

    return NextResponse.json({
      success: true,
      student: studentWithClass
    });

  } catch (error) {
    console.error('Get student error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}