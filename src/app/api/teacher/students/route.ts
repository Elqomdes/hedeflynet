import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User, Class } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const teacherId = user._id;

    // Get teacher's classes (main teacher or co-teacher)
    const classes = await Class.find({
      $or: [
        { teacherId },
        { coTeachers: teacherId }
      ]
    }).select('students').lean();

    // Collect all student IDs
    const studentIdSet = new Set<string>();
    for (const cls of classes) {
      if (Array.isArray((cls as any).students)) {
        for (const sid of (cls as any).students) {
          studentIdSet.add(String(sid));
        }
      }
    }

    const teacherStudentIds = Array.from(studentIdSet);

    // Get student details
    const students = await User.find({
      _id: { $in: teacherStudentIds },
      role: 'student'
    })
      .select('_id firstName lastName email classId')
      .lean();

    // Add class names to students
    const studentsWithClassNames = await Promise.all(
      students.map(async (student) => {
        if (student.classId) {
          const classInfo = await Class.findById(student.classId).select('name').lean();
          return {
            ...student,
            className: classInfo?.name || null
          };
        }
        return student;
      })
    );

    return NextResponse.json(studentsWithClassNames);

  } catch (error) {
    console.error('Get teacher students error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}