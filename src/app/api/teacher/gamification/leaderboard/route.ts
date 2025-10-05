import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { GamificationService } from '@/lib/services/gamificationService';

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

    const gamificationService = GamificationService.getInstance();
    
    // Get real leaderboard data
    const leaderboard = await gamificationService.getLeaderboard('all_time', 'experience');
    
    // Transform to match expected format
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: entry.rank,
      studentId: entry.userId,
      studentName: entry.displayName,
      points: entry.score,
      level: entry.level,
      badges: 0 // Will be calculated from actual achievements
    }));

    return NextResponse.json({ data: formattedLeaderboard });

  } catch (error) {
    console.error('Get gamification leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
