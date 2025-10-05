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

    // Önce mevcut AI önerilerini getir
    let recommendations = await AIRecommendation.find({})
      .populate('studentId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    // Eğer hiç öneri yoksa, yeni öneriler oluştur
    if (recommendations.length === 0) {
      await generateAIRecommendations();
      recommendations = await AIRecommendation.find({})
        .populate('studentId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .lean();
    }

    // Önerileri frontend formatına dönüştür
    const formattedRecommendations = recommendations.map(rec => ({
      id: rec._id.toString(),
      studentId: rec.studentId._id.toString(),
      studentName: `${rec.studentId.firstName} ${rec.studentId.lastName}`,
      type: rec.type,
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      createdAt: rec.createdAt.toISOString(),
      status: rec.status,
      category: rec.category,
      estimatedImpact: rec.estimatedImpact,
      actionRequired: rec.actionRequired,
      appliedAt: rec.appliedAt?.toISOString(),
      dismissedAt: rec.dismissedAt?.toISOString()
    }));

    return NextResponse.json({ data: formattedRecommendations });

  } catch (error) {
    console.error('Get AI recommendations error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// AI önerileri oluşturma fonksiyonu
async function generateAIRecommendations() {
  try {
    // Öğretmenin öğrencilerini getir
    const students = await User.find({ role: 'student' }).lean();
    
    for (const student of students) {
      const assignments = await Assignment.find({ student: student._id }).lean();
      const submissions = await AssignmentSubmission.find({ student: student._id }).lean();
      const goals = await Goal.find({ student: student._id }).lean();

      // Ödev tamamlama oranı
      const completedAssignments = submissions.filter(s => s.status === 'submitted').length;
      const completionRate = assignments.length > 0 ? (completedAssignments / assignments.length) * 100 : 0;

      // Ortalama not
      const gradedSubmissions = submissions.filter(s => s.grade !== undefined);
      const averageGrade = gradedSubmissions.length > 0 
        ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length 
        : 0;

      // Hedef ilerlemesi
      const completedGoals = goals.filter(g => g.status === 'completed').length;
      const goalProgress = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

      // AI önerileri oluştur ve veritabanına kaydet
      if (completionRate < 70) {
        const recommendation = new AIRecommendation({
          studentId: student._id,
          type: 'study_plan',
          title: 'Ödev Tamamlama Oranı Düşük',
          description: `${student.firstName} için ödev tamamlama oranı %${Math.round(completionRate)}. Daha düzenli çalışma planı önerilir.`,
          priority: completionRate < 50 ? 'high' : 'medium',
          category: 'Çalışma Planı',
          estimatedImpact: completionRate < 50 ? 8 : 6,
          actionRequired: true,
          reason: `Ödev tamamlama oranı %${Math.round(completionRate)} ile düşük seviyede`,
          confidence: 85,
          relatedData: {
            assignments: assignments.map(a => a._id),
            submissions: submissions.map(s => s._id)
          }
        });
        await recommendation.save();
      }

      if (averageGrade < 60 && gradedSubmissions.length > 0) {
        const recommendation = new AIRecommendation({
          studentId: student._id,
          type: 'difficulty',
          title: 'Not Ortalaması Düşük',
          description: `${student.firstName}'in ortalama notu ${Math.round(averageGrade)}. Ek destek ve zorluk seviyesi ayarlaması gerekebilir.`,
          priority: averageGrade < 40 ? 'high' : 'medium',
          category: 'Zorluk Seviyesi',
          estimatedImpact: averageGrade < 40 ? 9 : 7,
          actionRequired: true,
          reason: `Ortalama not ${Math.round(averageGrade)} ile düşük seviyede`,
          confidence: 90,
          relatedData: {
            submissions: gradedSubmissions.map(s => s._id)
          }
        });
        await recommendation.save();
      }

      if (goalProgress < 50 && goals.length > 0) {
        const recommendation = new AIRecommendation({
          studentId: student._id,
          type: 'motivation',
          title: 'Hedef İlerlemesi Yavaş',
          description: `${student.firstName} için hedef ilerlemesi %${Math.round(goalProgress)}. Motivasyon artırıcı aktiviteler önerilir.`,
          priority: 'medium',
          category: 'Motivasyon',
          estimatedImpact: 6,
          actionRequired: true,
          reason: `Hedef ilerlemesi %${Math.round(goalProgress)} ile yavaş`,
          confidence: 75,
          relatedData: {
            goals: goals.map(g => g._id)
          }
        });
        await recommendation.save();
      }

      // Başarılı öğrenciler için pozitif öneriler
      if (completionRate > 90 && averageGrade > 80) {
        const recommendation = new AIRecommendation({
          studentId: student._id,
          type: 'schedule',
          title: 'Gelişmiş İçerik Önerisi',
          description: `${student.firstName} mükemmel performans gösteriyor. Daha zorlu içerikler ve projeler önerilir.`,
          priority: 'low',
          category: 'Gelişim',
          estimatedImpact: 5,
          actionRequired: false,
          reason: `Mükemmel performans: %${Math.round(completionRate)} tamamlama, ${Math.round(averageGrade)} ortalama`,
          confidence: 80,
          relatedData: {
            assignments: assignments.map(a => a._id),
            goals: goals.map(g => g._id)
          }
        });
        await recommendation.save();
      }
    }
  } catch (error) {
    console.error('Generate AI recommendations error:', error);
  }
}
