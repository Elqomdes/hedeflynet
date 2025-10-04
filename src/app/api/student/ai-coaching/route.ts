import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { AICoachingService } from '@/lib/services/aiCoachingService';
import { User, Assignment, AssignmentSubmission, Goal } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'student') {
      return NextResponse.json(
        { error: 'Sadece öğrenciler AI koçluk önerilerini alabilir' },
        { status: 401 }
      );
    }

    await connectDB();

    const studentId = (authResult._id as any).toString();

    // Get student data
    const assignments = await Assignment.find({ 
      $or: [
        { studentId },
        { 'students': studentId }
      ]
    }).lean();

    const submissions = await AssignmentSubmission.find({ studentId }).lean();
    const goals = await Goal.find({ studentId }).lean();

    // Calculate performance history
    const performanceHistory = await calculatePerformanceHistory(studentId, submissions);

    // Calculate study time (simplified)
    const studyTime = {
      totalHours: Math.floor(Math.random() * 100), // Placeholder
      weeklyAverage: Math.floor(Math.random() * 20), // Placeholder
      consistency: Math.floor(Math.random() * 10) + 1 // Placeholder
    };

    const coachingData = {
      studentId,
      assignments,
      submissions,
      goals,
      performanceHistory,
      studyTime
    };

    // Generate AI recommendations
    const aiService = AICoachingService.getInstance();
    const recommendations = await aiService.generateRecommendations(coachingData);
    const studySchedule = await aiService.generateStudySchedule(coachingData);
    const successPrediction = await aiService.predictSuccess(coachingData);

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        studySchedule,
        successPrediction,
        stats: {
          totalAssignments: assignments.length,
          completedAssignments: submissions.filter(s => s.status === 'submitted').length,
          totalGoals: goals.length,
          completedGoals: goals.filter(g => g.status === 'completed').length
        }
      }
    });

  } catch (error) {
    console.error('AI Coaching API Error:', error);
    return NextResponse.json(
      { 
        error: 'AI koçluk verileri alınamadı',
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
        { error: 'Sadece öğrenciler AI koçluk önerilerini alabilir' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, recommendationId } = body;

    if (action === 'mark_completed' && recommendationId) {
      // Mark recommendation as completed
      // This would typically be stored in a database
      return NextResponse.json({
        success: true,
        message: 'Öneri tamamlandı olarak işaretlendi'
      });
    }

    return NextResponse.json(
      { error: 'Geçersiz işlem' },
      { status: 400 }
    );

  } catch (error) {
    console.error('AI Coaching POST Error:', error);
    return NextResponse.json(
      { 
        error: 'İşlem gerçekleştirilemedi',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}

async function calculatePerformanceHistory(studentId: string, submissions: any[]) {
  // Group submissions by subject and calculate performance
  const subjectPerformance: { [key: string]: { scores: number[], count: number } } = {};
  
  submissions.forEach(submission => {
    if (submission.grade !== undefined) {
      const subject = submission.subject || 'Genel';
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = { scores: [], count: 0 };
      }
      subjectPerformance[subject].scores.push(submission.grade);
      subjectPerformance[subject].count++;
    }
  });

  const performanceHistory = Object.entries(subjectPerformance).map(([subject, data]) => {
    const averageScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
    
    // Simple trend calculation (in real implementation, use more sophisticated logic)
    const trend = (averageScore >= 80 ? 'improving' : 
                  averageScore >= 60 ? 'stable' : 'declining') as 'improving' | 'stable' | 'declining';
    
    return {
      subject,
      averageScore: Math.round(averageScore),
      trend,
      lastUpdated: new Date()
    };
  });

  return performanceHistory;
}
