import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Class, Assignment, Goal } from '@/lib/models';
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
    }).select('students').lean();

    // Get all student IDs from teacher's classes
    const studentIds = new Set<string>();
    for (const cls of classes) {
      if (Array.isArray((cls as any).students)) {
        for (const studentId of (cls as any).students) {
          studentIds.add(String(studentId));
        }
      }
    }

    const teacherStudentIds = Array.from(studentIds);

    // Get statistics
    const [
      totalStudents,
      activeStudents,
      totalClasses,
      totalAssignments,
      totalGoals
    ] = await Promise.all([
      teacherStudentIds.length > 0 ? User.countDocuments({ 
        _id: { $in: teacherStudentIds }, 
        role: 'student' 
      }) : Promise.resolve(0),
      teacherStudentIds.length > 0 ? User.countDocuments({ 
        _id: { $in: teacherStudentIds }, 
        role: 'student',
        isActive: true 
      }) : Promise.resolve(0),
      Class.countDocuments({ 
        $or: [
          { teacherId },
          { coTeachers: teacherId }
        ]
      }),
      Assignment.countDocuments({ teacherId }),
      Goal.countDocuments({ teacherId })
    ]);

    // Calculate recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentActivity = await User.countDocuments({
      _id: { $in: teacherStudentIds },
      role: 'student',
      lastLogin: { $gte: thirtyDaysAgo }
    });

    return NextResponse.json({
      success: true,
      totalStudents,
      activeStudents,
      totalClasses,
      totalAssignments,
      totalGoals,
      recentActivity: Math.ceil((30 - (Date.now() - teacher.createdAt.getTime()) / (1000 * 60 * 60 * 24)))
    });

  } catch (error) {
    console.error('Get teacher stats error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
