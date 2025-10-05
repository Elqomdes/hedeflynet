import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Goal, Parent } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import { GamificationService } from '@/lib/services/gamificationService';
import { MobileService } from '@/lib/services/mobileService';

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

    // Cross-feature integrations when goal is completed
    if (goal.status === 'completed') {
      try {
        const gamification = GamificationService.getInstance();
        await gamification.addExperience(String(authResult._id), 20, 'goal_complete');
        await gamification.checkAchievements(String(authResult._id), 'goal');
      } catch (e) {
        console.error('Gamification on goal complete error:', e);
      }

      try {
        const mobile = MobileService.getInstance();
        await mobile.sendPushNotification(String(authResult._id), {
          title: 'Tebrikler! Hedef Tamamlandı',
          body: 'Bir hedefinizi başarıyla tamamladınız. Harika ilerliyorsunuz!',
          data: { type: 'goal', goalId: String(goalId) },
          priority: 'high'
        });

        // Notify parents linked to the student
        try {
          const parents = await Parent.find({ children: authResult._id }).lean();
          for (const parent of parents) {
            await mobile.sendPushNotification(String((parent as any).user), {
              title: 'Çocuğunuz Bir Hedefini Tamamladı',
              body: 'Harika haber! Çocuğunuz bir hedefini tamamladı.',
              data: { type: 'goal', studentId: String(authResult._id), goalId: String(goalId) },
              priority: 'normal'
            });
          }
        } catch (pnErr) {
          console.error('Parent notify on goal complete error:', pnErr);
        }
      } catch (e) {
        console.error('Mobile notification on goal complete error:', e);
      }
    }

    return NextResponse.json({ message: 'Hedef güncellendi', goal });
  } catch (error) {
    console.error('Update student goal error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}


