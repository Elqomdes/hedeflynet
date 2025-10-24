import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Goal, User, Class } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const teacherId = authResult._id;
    
    // Get teacher's students from classes
    const classes = await Class.find({
      $or: [
        { teacherId },
        { coTeachers: teacherId }
      ]
    }).select('students').lean();

    const studentIds = new Set<string>();
    for (const cls of classes) {
      if (Array.isArray((cls as any).students)) {
        for (const studentId of (cls as any).students) {
          studentIds.add(String(studentId));
        }
      }
    }

    const goals = await Goal.find({ 
      teacherId,
      studentId: { $in: Array.from(studentIds) }
    })
    .populate('studentId', 'firstName lastName email')
    .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      goals
    });
  } catch (error) {
    console.error('Get teacher goals error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { studentId, title, description, targetDate, category, priority, successCriteria } = await request.json();

    if (!studentId || !title || !description || !targetDate || !successCriteria) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the student belongs to the teacher
    const classes = await Class.find({
      $or: [
        { teacherId: authResult._id },
        { coTeachers: authResult._id }
      ],
      students: studentId
    });

    if (classes.length === 0) {
      return NextResponse.json(
        { error: 'Student not found in your classes' },
        { status: 400 }
      );
    }

    const goal = new Goal({
      studentId,
      teacherId: authResult._id,
      title,
      description,
      targetDate: new Date(targetDate),
      category: category || 'academic',
      priority: priority || 'medium',
      successCriteria
    });

    await goal.save();

    return NextResponse.json({
      success: true,
      goal
    });
  } catch (error) {
    console.error('Create teacher goal error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
