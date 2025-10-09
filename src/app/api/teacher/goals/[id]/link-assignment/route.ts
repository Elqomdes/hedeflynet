import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Goal, Assignment } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
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
    const { assignmentId } = await request.json();

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Ödev ID gereklidir' },
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

    // Check if assignment belongs to this teacher
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      teacherId: authResult._id
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Ödev bulunamadı veya yetkiniz yok' },
        { status: 404 }
      );
    }

    // Link assignment to goal
    const updatedGoal = await Goal.findByIdAndUpdate(
      goalId,
      { assignmentId },
      { new: true }
    ).populate('studentId', 'firstName lastName')
     .populate('assignmentId', 'title description dueDate');

    if (!updatedGoal) {
      return NextResponse.json(
        { error: 'Hedef güncellenemedi' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Link assignment error:', error);
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

    // Unlink assignment from goal
    const updatedGoal = await Goal.findByIdAndUpdate(
      goalId,
      { $unset: { assignmentId: 1 } },
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
    console.error('Unlink assignment error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
