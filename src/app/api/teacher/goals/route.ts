import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Goal, User } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

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

    // Get goals created by this teacher
    const goals = await Goal.find({ teacherId })
      .populate('studentId', 'firstName lastName')
      .sort({ targetDate: 1 });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Teacher goals error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
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

    const { title, description, targetDate, studentId, category, priority, assignmentId, successCriteria } = await request.json();

    if (!title || !description || !targetDate || !studentId || !successCriteria) {
      return NextResponse.json(
        { error: 'Tüm gerekli alanlar doldurulmalıdır' },
        { status: 400 }
      );
    }

    await connectDB();

    const goal = new Goal({
      studentId,
      teacherId: authResult._id,
      title,
      description,
      targetDate: new Date(targetDate),
      status: 'pending',
      progress: 0,
      category: category || 'academic',
      priority: priority || 'medium',
      assignmentId: assignmentId || null,
      successCriteria,
      parentNotificationSent: false
    });

    await goal.save();

    // Populate the created goal
    const populatedGoal = await Goal.findById(goal._id)
      .populate('studentId', 'firstName lastName');

    return NextResponse.json(populatedGoal, { status: 201 });
  } catch (error) {
    console.error('Create goal error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

