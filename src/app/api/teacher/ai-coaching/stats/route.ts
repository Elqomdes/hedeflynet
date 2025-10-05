import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User, Assignment, AssignmentSubmission, Goal, AIRecommendation } from '@/lib/models';

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

    // AI önerileri gerçek verileri
    const totalRecommendations = await AIRecommendation.countDocuments();
    const appliedRecommendations = await AIRecommendation.countDocuments({ status: 'applied' });
    const pendingRecommendations = await AIRecommendation.countDocuments({ status: 'pending' });
    const dismissedRecommendations = await AIRecommendation.countDocuments({ status: 'dismissed' });
    
    // Başarı oranı hesapla (uygulanan / toplam)
    const successRate = totalRecommendations > 0 ? Math.round((appliedRecommendations / totalRecommendations) * 100) : 0;
    
    // Üst performans gösteren öğrenci sayısı (ortalama not > 80)
    const topPerformingStudents = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $lookup: {
          from: 'assignmentsubmissions',
          localField: '_id',
          foreignField: 'student',
          as: 'submissions'
        }
      },
      {
        $addFields: {
          averageGrade: {
            $avg: {
              $map: {
                input: { $filter: { input: '$submissions', cond: { $ne: ['$$this.grade', null] } } },
                as: 'sub',
                in: '$$sub.grade'
              }
            }
          }
        }
      },
      { $match: { averageGrade: { $gt: 80 } } },
      { $count: 'count' }
    ]);
    
    const topPerformingCount = topPerformingStudents.length > 0 ? topPerformingStudents[0].count : 0;
    
    // Ortalama yanıt süresi (saat cinsinden)
    const responseTimeData = await AIRecommendation.aggregate([
      {
        $match: {
          $or: [
            { appliedAt: { $exists: true } },
            { dismissedAt: { $exists: true } }
          ]
        }
      },
      {
        $addFields: {
          responseTime: {
            $divide: [
              {
                $subtract: [
                  { $ifNull: ['$appliedAt', '$dismissedAt'] },
                  '$createdAt'
                ]
              },
              1000 * 60 * 60 // milisaniyeyi saate çevir
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);
    
    const averageResponseTime = responseTimeData.length > 0 ? Math.round(responseTimeData[0].averageResponseTime) : 0;

    const stats = {
      totalRecommendations,
      appliedRecommendations,
      pendingRecommendations,
      dismissedRecommendations,
      successRate,
      topPerformingStudents: topPerformingCount,
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
