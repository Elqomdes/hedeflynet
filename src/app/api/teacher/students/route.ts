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
      .select('_id firstName lastName email phone username isActive createdAt classId')
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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { firstName, lastName, username, email, password, phone } = body || {};

    if (!firstName || !lastName || !username || !email || !password) {
      return NextResponse.json(
        { error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    // Ensure username/email uniqueness implicitly uses schema constraints; handle duplicate key errors gracefully
    const { User } = await import('@/lib/models');

    const newStudent = new (User as any)({
      firstName,
      lastName,
      username,
      email,
      password,
      phone: phone || '',
      role: 'student',
      isActive: true,
    });

    await newStudent.save();

    return NextResponse.json({
      success: true,
      student: {
        id: newStudent._id,
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        email: newStudent.email,
        username: newStudent.username,
        phone: newStudent.phone || '',
        isActive: newStudent.isActive,
        createdAt: newStudent.createdAt,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create student error:', error);
    // Handle duplicate key error
    if (error && (error.code === 11000 || error.code === '11000')) {
      const fields = Object.keys(error.keyPattern || {});
      return NextResponse.json(
        { error: `${fields.join(', ')} zaten kullanımda` },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}