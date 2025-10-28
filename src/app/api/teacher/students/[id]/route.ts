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

    return NextResponse.json(studentWithClass);

  } catch (error) {
    console.error('Get student error:', error);
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
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const teacherId = authResult._id;
    const studentId = params.id;

    const connection = await connectDB();
    if (!connection) {
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı' },
        { status: 500 }
      );
    }

    // Only allow deletion if the student is in one of the teacher's classes
    const isInTeachersClass = await Class.exists({
      $or: [
        { teacherId },
        { coTeachers: teacherId }
      ],
      students: studentId
    });

    if (!isInTeachersClass) {
      return NextResponse.json(
        { error: 'Bu öğrenci sizin sınıflarınızda değil' },
        { status: 403 }
      );
    }

    await User.deleteOne({ _id: studentId, role: 'student' });

    // Remove student from any classes they belonged to
    await Class.updateMany(
      { students: studentId },
      { $pull: { students: studentId } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}