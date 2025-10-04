import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { GamificationService } from '@/lib/services/gamificationService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authResult = await getCurrentUser(request);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'weekly' | 'monthly' | 'all_time' || 'weekly';
    const category = searchParams.get('category') as 'experience' | 'achievements' | 'streaks' | 'assignments' || 'experience';

    const gamificationService = GamificationService.getInstance();
    const leaderboard = await gamificationService.getLeaderboard(type, category);

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        type,
        category,
        period: {
          start: new Date(),
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return NextResponse.json(
      { 
        error: 'Leaderboard verileri alınamadı',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}
