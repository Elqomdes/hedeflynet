import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Goal } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
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

    const goalId = params.id;
    const { title, description, targetDate, studentId, category, priority, assignmentId, successCriteria } = await request.json();

    if (!title || !description || !targetDate || !studentId || !successCriteria) {
      return NextResponse.json(
        { error: 'Tüm gerekli alanlar doldurulmalıdır' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if goal belongs to this teacher
    const goal = await Goal.findOne({
      _id: goalId,
      teacherId: authResult._id
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Hedef bulunamadı veya yetkiniz yok' },
        { status: 404 }
      );
    }

    // Update goal
    const updatedGoal = await Goal.findByIdAndUpdate(
      goalId,
      {
        title,
        description,
        targetDate: new Date(targetDate),
        studentId,
        category: category || 'academic',
        priority: priority || 'medium',
        assignmentId: assignmentId || null,
        successCriteria
      },
      { new: true }
    ).populate('studentId', 'firstName lastName');

    if (!updatedGoal) {
      return NextResponse.json(
        { error: 'Hedef güncellenemedi' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Update goal error:', error);
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

    const goalId = params.id;

    await connectDB();

    // Check if goal belongs to this teacher
    const goal = await Goal.findOne({
      _id: goalId,
      teacherId: authResult._id
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Hedef bulunamadı veya yetkiniz yok' },
        { status: 404 }
      );
    }

    await Goal.findByIdAndDelete(goalId);

    return NextResponse.json({ message: 'Hedef başarıyla silindi' });
  } catch (error) {
    console.error('Delete goal error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

