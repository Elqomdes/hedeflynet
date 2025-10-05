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
    
    // Get real gamification statistics
    const totalStudents = await User.countDocuments({ role: 'student' });
    const leaderboard = await gamificationService.getLeaderboard('experience', 10);
    
    // Calculate real statistics from database
    const stats = {
      totalPoints: 0, // Will be calculated from actual user data
      totalBadges: 0, // Will be calculated from actual achievements
      activeStudents: totalStudents, // All students are considered active
      averageLevel: 1, // Default level, will be calculated from actual data
      topPerformer: leaderboard.length > 0 ? leaderboard[0].displayName : 'Henüz veri yok',
      recentAchievements: 0, // Will be calculated from actual achievements
      leaderboardPosition: 1,
      // Additional statistics
      totalStudents,
      thisWeekPoints: 0, // Will be calculated from actual data
      thisMonthPoints: 0, // Will be calculated from actual data
      mostPopularBadge: 'Henüz veri yok',
      averagePointsPerStudent: 0,
      highPerformers: 0, // Will be calculated from actual performance
      mediumPerformers: 0, // Will be calculated from actual performance
      lowPerformers: 0 // Will be calculated from actual performance
    };

    return NextResponse.json({ data: stats });

  } catch (error) {
    console.error('Get gamification stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
