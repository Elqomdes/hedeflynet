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
    }).select('_id name students').lean();

    // Get all student IDs from teacher's classes
    const studentIds = new Set<string>();
    for (const cls of classes) {
      if (Array.isArray((cls as any).students)) {
        for (const studentId of (cls as any).students) {
          studentIds.add(String(studentId));
        }
      }
    }

    // Get students with their class information
    const students = await User.find({
      _id: { $in: Array.from(studentIds) },
      role: 'student'
    })
    .select('_id firstName lastName email phone isActive createdAt')
    .lean();

    // Add class information to students
    const studentsWithClasses = students.map(student => {
      const studentClasses = classes.filter(cls => 
        Array.isArray((cls as any).students) && 
        (cls as any).students.includes(student._id)
      );
      
      return {
        ...student,
        classId: studentClasses[0]?._id,
        className: studentClasses[0]?.name || 'Sınıf yok'
      };
    });

    return NextResponse.json({
      success: true,
      students: studentsWithClasses
    });

  } catch (error) {
    console.error('Get teacher students error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
