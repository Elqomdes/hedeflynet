import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Class } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
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

    await connectDB();

    const student = await User.findById(params.id)
      .select('-password');

    if (!student) {
      return NextResponse.json(
        { error: 'Öğrenci bulunamadı' },
        { status: 404 }
      );
    }

    if (student.role !== 'student') {
      return NextResponse.json(
        { error: 'Bu kullanıcı öğrenci değil' },
        { status: 400 }
      );
    }

    // Authorization: ensure this student belongs to one of teacher's classes
    const teacherId = authResult._id;
    const isInTeachersClasses = await Class.exists({
      $or: [
        { teacherId },
        { coTeachers: teacherId }
      ],
      students: student._id
    });

    if (!isInTeachersClasses) {
      return NextResponse.json(
        { error: 'Unauthorized: Student not assigned to this teacher' },
        { status: 403 }
      );
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}