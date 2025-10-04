import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { GamificationService } from '@/lib/services/gamificationService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'student') {
      return NextResponse.json(
        { error: 'Sadece öğrenciler gamification verilerini alabilir' },
        { status: 401 }
      );
    }

    await connectDB();

    const studentId = (authResult._id as any).toString();
    const gamificationService = GamificationService.getInstance();

    // Initialize default achievements if needed
    await gamificationService.initializeDefaultAchievements();

    // Get user stats
    const stats = await gamificationService.getUserStats(studentId);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Gamification API Error:', error);
    return NextResponse.json(
      { 
        error: 'Gamification verileri alınamadı',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'student') {
      return NextResponse.json(
        { error: 'Sadece öğrenciler gamification işlemleri yapabilir' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    await connectDB();
    const gamificationService = GamificationService.getInstance();

    switch (action) {
      case 'add_experience':
        const { points, source } = data;
        const experienceResult = await gamificationService.addExperience(
          (authResult._id as any).toString(),
          points,
          source
        );
        return NextResponse.json({
          success: true,
          data: experienceResult
        });

      case 'update_streak':
        const { type } = data;
        const streakResult = await gamificationService.updateStreak(
          (authResult._id as any).toString(),
          type
        );
        return NextResponse.json({
          success: true,
          data: streakResult
        });

      case 'check_achievements':
        const achievements = await gamificationService.checkAchievements(
          (authResult._id as any).toString(),
          data.source || 'manual'
        );
        return NextResponse.json({
          success: true,
          data: { achievements }
        });

      default:
        return NextResponse.json(
          { error: 'Geçersiz işlem' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Gamification POST Error:', error);
    return NextResponse.json(
      { 
        error: 'İşlem gerçekleştirilemedi',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}
