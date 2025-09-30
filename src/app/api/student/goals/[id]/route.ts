import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Goal } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const goalId = params.id;
    const { status, progress } = await request.json();

    if (status && !['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 });
    }
    if (progress !== undefined && (typeof progress !== 'number' || progress < 0 || progress > 100)) {
      return NextResponse.json({ error: 'Geçersiz ilerleme' }, { status: 400 });
    }

    await connectDB();

    const goal = await Goal.findOne({ _id: goalId, studentId: authResult._id });
    if (!goal) {
      return NextResponse.json({ error: 'Hedef bulunamadı' }, { status: 404 });
    }

    if (status) {
      goal.status = status;
      if (status === 'completed') {
        goal.progress = 100;
      }
    }
    if (progress !== undefined) {
      goal.progress = progress;
      if (progress >= 100) {
        goal.status = 'completed';
      } else if (progress > 0 && goal.status === 'pending') {
        goal.status = 'in_progress';
      }
    }

    await goal.save();

    return NextResponse.json({ message: 'Hedef güncellendi', goal });
  } catch (error) {
    console.error('Update student goal error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}


