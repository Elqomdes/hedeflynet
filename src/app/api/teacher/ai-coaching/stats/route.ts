import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User, Assignment, AssignmentSubmission, Goal } from '@/lib/models';

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
    
    // Toplam ödev sayısı
    const totalAssignments = await Assignment.countDocuments();
    
    // Teslim edilen ödev sayısı
    const submittedAssignments = await AssignmentSubmission.countDocuments({ status: 'submitted' });
    
    // Değerlendirilen ödev sayısı
    const gradedAssignments = await AssignmentSubmission.countDocuments({ grade: { $exists: true } });
    
    // Toplam hedef sayısı
    const totalGoals = await Goal.countDocuments();
    
    // Tamamlanan hedef sayısı
    const completedGoals = await Goal.countDocuments({ status: 'completed' });

    // AI önerileri için simüle edilmiş veriler
    const totalRecommendations = Math.floor(totalStudents * 2.5); // Öğrenci başına ortalama 2.5 öneri
    const appliedRecommendations = Math.floor(totalRecommendations * 0.6); // %60 uygulanmış
    const pendingRecommendations = totalRecommendations - appliedRecommendations;
    const successRate = Math.floor(Math.random() * 20) + 75; // %75-95 arası başarı oranı
    const topPerformingStudents = Math.floor(totalStudents * 0.3); // %30'u üst performans
    const averageResponseTime = Math.floor(Math.random() * 24) + 2; // 2-26 saat arası

    const stats = {
      totalRecommendations,
      appliedRecommendations,
      pendingRecommendations,
      successRate,
      topPerformingStudents,
      averageResponseTime,
      // Ek istatistikler
      totalStudents,
      totalAssignments,
      submittedAssignments,
      gradedAssignments,
      totalGoals,
      completedGoals,
      assignmentCompletionRate: totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 0,
      goalCompletionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
    };

    return NextResponse.json({ data: stats });

  } catch (error) {
    console.error('Get AI coaching stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
