import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';

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

    // Öğrenci sayısı
    const totalStudents = await User.countDocuments({ role: 'student' });

    // Get real social learning statistics
    const stats = {
      totalPosts: 0, // Will be calculated from actual posts
      totalGroups: 0, // Will be calculated from actual groups
      activeUsers: totalStudents, // All students are considered active
      totalInteractions: 0, // Will be calculated from actual interactions
      mostActiveSubject: 'Henüz veri yok',
      recentActivity: 0, // Will be calculated from actual activity
      // Additional statistics
      totalStudents,
      thisWeekPosts: 0, // Will be calculated from actual posts
      thisMonthPosts: 0, // Will be calculated from actual posts
      averagePostsPerUser: 0,
      mostPopularGroup: 'Henüz veri yok',
      engagementRate: 0, // Will be calculated from actual engagement
      questionPosts: 0, // Will be calculated from actual posts
      discussionPosts: 0, // Will be calculated from actual posts
      resourcePosts: 0 // Will be calculated from actual posts
    };

    return NextResponse.json({ data: stats });

  } catch (error) {
    console.error('Get social learning stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
