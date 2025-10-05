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

    // Öğretmenin öğrencilerini getir
    const students = await User.find({ role: 'student' }).lean();
    
    // Her öğrenci için AI önerileri oluştur (simüle edilmiş)
    const recommendations = [];

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

      // AI önerileri oluştur
      if (completionRate < 70) {
        recommendations.push({
          id: `rec_${student._id}_completion`,
          studentId: student._id.toString(),
          studentName: `${student.firstName} ${student.lastName}`,
          type: 'study_plan',
          title: 'Ödev Tamamlama Oranı Düşük',
          description: `${student.firstName} için ödev tamamlama oranı %${Math.round(completionRate)}. Daha düzenli çalışma planı önerilir.`,
          priority: completionRate < 50 ? 'high' : 'medium',
          createdAt: new Date().toISOString(),
          status: 'pending'
        });
      }

      if (averageGrade < 60 && gradedSubmissions.length > 0) {
        recommendations.push({
          id: `rec_${student._id}_grade`,
          studentId: student._id.toString(),
          studentName: `${student.firstName} ${student.lastName}`,
          type: 'difficulty',
          title: 'Not Ortalaması Düşük',
          description: `${student.firstName}'in ortalama notu ${Math.round(averageGrade)}. Ek destek ve zorluk seviyesi ayarlaması gerekebilir.`,
          priority: averageGrade < 40 ? 'high' : 'medium',
          createdAt: new Date().toISOString(),
          status: 'pending'
        });
      }

      if (goalProgress < 50 && goals.length > 0) {
        recommendations.push({
          id: `rec_${student._id}_goals`,
          studentId: student._id.toString(),
          studentName: `${student.firstName} ${student.lastName}`,
          type: 'motivation',
          title: 'Hedef İlerlemesi Yavaş',
          description: `${student.firstName} için hedef ilerlemesi %${Math.round(goalProgress)}. Motivasyon artırıcı aktiviteler önerilir.`,
          priority: 'medium',
          createdAt: new Date().toISOString(),
          status: 'pending'
        });
      }

      // Başarılı öğrenciler için pozitif öneriler
      if (completionRate > 90 && averageGrade > 80) {
        recommendations.push({
          id: `rec_${student._id}_advanced`,
          studentId: student._id.toString(),
          studentName: `${student.firstName} ${student.lastName}`,
          type: 'schedule',
          title: 'Gelişmiş İçerik Önerisi',
          description: `${student.firstName} mükemmel performans gösteriyor. Daha zorlu içerikler ve projeler önerilir.`,
          priority: 'low',
          createdAt: new Date().toISOString(),
          status: 'pending'
        });
      }
    }

    // Önerileri tarihe göre sırala
    recommendations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ data: recommendations });

  } catch (error) {
    console.error('Get AI recommendations error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
