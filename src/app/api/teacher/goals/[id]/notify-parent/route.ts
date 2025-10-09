import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Goal, User, Parent, ParentNotification } from '@/lib/models';
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
    const { message } = await request.json();

    await connectDB();

    // Get goal with student info
    const goal = await Goal.findOne({
      _id: goalId,
      teacherId: authResult._id
    }).populate('studentId', 'firstName lastName');

    if (!goal) {
      return NextResponse.json(
        { error: 'Hedef bulunamadı veya yetkiniz yok' },
        { status: 404 }
      );
    }

    // Type guard for populated studentId
    if (!goal.studentId || typeof goal.studentId === 'string') {
      return NextResponse.json(
        { error: 'Öğrenci bilgisi yüklenemedi' },
        { status: 500 }
      );
    }

    const student = goal.studentId as { _id: string; firstName: string; lastName: string };

    // Find parent of the student
    const parent = await Parent.findOne({
      children: student._id
    }).populate('userId', 'firstName lastName email');

    if (!parent) {
      return NextResponse.json(
        { error: 'Öğrencinin velisi bulunamadı' },
        { status: 404 }
      );
    }

    // Create notification for parent
    const notification = {
      parentId: parent._id,
      studentId: student._id,
      type: 'goal_achieved' as const,
      title: `Hedef Güncellemesi - ${goal.title}`,
      message: message || `${student.firstName} ${student.lastName} öğrencisinin "${goal.title}" hedefi ${goal.status === 'completed' ? 'tamamlandı' : 'güncellendi'}. İlerleme: %${goal.progress}`,
      priority: goal.priority === 'high' ? 'high' : 'medium' as const,
      data: {
        goalId: goal._id,
        goalTitle: goal.title,
        goalStatus: goal.status,
        goalProgress: goal.progress,
        studentName: `${student.firstName} ${student.lastName}`
      }
    };

    // Create parent notification using ParentNotification model
    const parentNotification = await ParentNotification.create(notification);

    // Mark goal as notification sent
    await Goal.findByIdAndUpdate(goalId, {
      parentNotificationSent: true
    });

    return NextResponse.json({ 
      message: 'Veliye bildirim gönderildi',
      notification 
    });
  } catch (error) {
    console.error('Parent notification error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
