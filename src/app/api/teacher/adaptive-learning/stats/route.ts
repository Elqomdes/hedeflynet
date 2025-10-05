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

    // Get real adaptive learning statistics
    const stats = {
      totalModules: 0, // Will be calculated from actual modules
      activeModules: 0, // Will be calculated from actual modules
      enrolledStudents: totalStudents, // All students are considered enrolled
      averageCompletionRate: 0, // Will be calculated from actual completions
      averageScore: 0, // Will be calculated from actual scores
      totalLearningHours: 0, // Will be calculated from actual learning time
      topPerformingModule: 'Henüz veri yok',
      strugglingStudents: 0, // Will be calculated from actual performance
      // Additional statistics
      totalStudents,
      adaptiveModules: 0, // Will be calculated from actual modules
      regularModules: 0, // Will be calculated from actual modules
      thisWeekCompletions: 0, // Will be calculated from actual completions
      thisMonthCompletions: 0, // Will be calculated from actual completions
      averageTimePerModule: 0, // Will be calculated from actual time data
      mostPopularSubject: 'Henüz veri yok',
      leastPopularSubject: 'Henüz veri yok',
      highPerformers: 0, // Will be calculated from actual performance
      mediumPerformers: 0, // Will be calculated from actual performance
      lowPerformers: 0 // Will be calculated from actual performance
    };

    return NextResponse.json({ data: stats });

  } catch (error) {
    console.error('Get adaptive learning stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
