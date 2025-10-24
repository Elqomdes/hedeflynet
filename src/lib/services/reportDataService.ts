import connectDB from '@/lib/mongodb';
import { Assignment, AssignmentSubmission, User, Class, Goal } from '@/lib/models';
import { IUser } from '@/lib/models/User';
import { StudentReportData, ReportGenerationOptions } from '@/lib/models/ReportData';

// Type for populated assignment submission
interface PopulatedAssignmentSubmission {
  _id: string;
  assignmentId: {
    _id: string;
    title: string;
    maxGrade?: number;
  };
  studentId: string;
  status: string;
  grade?: number;
  maxGrade?: number;
  feedback?: string;
  teacherFeedback?: string;
  submittedAt?: Date;
  gradedAt?: Date;
  content?: string;
  attachments?: Array<{
    type: 'pdf' | 'video' | 'link' | 'image';
    url: string;
    name: string;
  }>;
  attempt?: number;
  versions?: Array<{
    attempt: number;
    submittedAt: Date;
    content?: string;
    attachments?: Array<{ type: 'pdf' | 'video' | 'link' | 'image'; url: string; name: string }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Type for populated assignment
interface PopulatedAssignment {
  _id: string;
  title: string;
  description: string;
  maxGrade: number;
  dueDate: Date;
  classId?: {
    _id: string;
    name: string;
  };
  teacherId: string;
  createdAt: Date;
}

export class ReportDataService {
  /**
   * Öğrenci rapor verilerini toplar
   */
  public static async collectStudentReportData(
    studentId: string,
    teacherId: string,
    startDate: Date,
    endDate: Date,
    options: ReportGenerationOptions = {}
  ): Promise<StudentReportData> {
    try {
      console.log('ReportDataService: Starting data collection', { studentId, teacherId });
      
      // MongoDB bağlantısını kontrol et
      const dbConnection = await connectDB();
      if (!dbConnection) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }

      // Öğrenci ve öğretmen bilgilerini al
      console.log('ReportDataService: Fetching user data');
      const [student, teacher] = await Promise.all([
        User.findById(studentId).select('firstName lastName email'),
        User.findById(teacherId).select('firstName lastName email')
      ]);

      if (!student) {
        throw new Error(`Öğrenci bulunamadı: ${studentId}`);
      }
      if (!teacher) {
        throw new Error(`Öğretmen bulunamadı: ${teacherId}`);
      }

      console.log('ReportDataService: User data fetched successfully');

      // Öğrencinin sınıf bilgisini al
      const studentClass = await Class.findOne({ students: studentId }).select('name');

      // Ödev istatistiklerini hesapla
      const assignmentStats = await this.calculateAssignmentStats(studentId, startDate, endDate);
      
      // Hedef istatistiklerini hesapla
      const goalStats = await this.calculateGoalStats(studentId, startDate, endDate);
      
      // Branş istatistiklerini hesapla
      const subjectStats = await this.calculateSubjectStats(studentId, startDate, endDate);
      
      // Aylık ilerleme verilerini hesapla
      const monthlyProgress = await this.calculateMonthlyProgress(studentId, startDate, endDate);
      
      // Son ödevleri al
      const recentAssignments = await this.getRecentAssignments(studentId, 10);
      
      // Hedefleri al
      const goals = await this.getGoals(studentId, 10);
      
      // İçgörüleri oluştur
      const insights = this.generateInsights(assignmentStats, goalStats, subjectStats);

      // Performans hesapla
      const performance = this.calculatePerformance(assignmentStats, goalStats, subjectStats);

      return {
        student: {
          id: (student._id as any).toString(),
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          class: studentClass?.name
        },
        teacher: {
          id: (teacher._id as any).toString(),
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email
        },
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        performance,
        statistics: {
          totalAssignments: assignmentStats.totalAssignments,
          submittedAssignments: assignmentStats.submittedAssignments,
          gradedAssignments: assignmentStats.gradedAssignments,
          pendingAssignments: assignmentStats.totalAssignments - assignmentStats.submittedAssignments,
          totalGoals: goalStats.totalGoals,
          completedGoals: goalStats.completedGoals
        },
        subjects: subjectStats,
        monthlyProgress,
        recentAssignments: recentAssignments.map(assignment => ({
          ...assignment,
          status: assignment.status as 'completed' | 'submitted' | 'graded' | 'pending',
          maxGrade: assignment.maxGrade || 100
        })),
        goals: goals.map(goal => ({
          ...goal,
          status: goal.status as 'completed' | 'pending' | 'in_progress'
        })),
        insights,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Report data collection error:', error);
      throw new Error(`Rapor verisi toplanamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  /**
   * Ödev istatistiklerini hesaplar
   */
  private static async calculateAssignmentStats(studentId: string, startDate: Date, endDate: Date) {
    // Tüm ödevleri al (tarih aralığındaki)
    const allAssignments = await Assignment.find({
      studentId,
      dueDate: { $gte: startDate, $lte: endDate }
    });

    const totalAssignments = allAssignments.length;

    // Bu ödevlerin teslim edilenlerini say
    const assignmentIds = allAssignments.map(a => a._id);
    const submittedAssignments = await AssignmentSubmission.countDocuments({
      assignmentId: { $in: assignmentIds },
      studentId,
      status: { $in: ['submitted', 'graded', 'completed'] }
    });

    const gradedAssignments = await AssignmentSubmission.countDocuments({
      assignmentId: { $in: assignmentIds },
      studentId,
      status: { $in: ['graded', 'completed'] }
    });

    // Ortalama not hesapla
    const gradedSubmissions = await AssignmentSubmission.find({
      assignmentId: { $in: assignmentIds },
      studentId,
      status: { $in: ['graded', 'completed'] },
      grade: { $exists: true, $ne: null }
    }).populate('assignmentId', 'maxGrade');

    let averageGrade = 0;
    if (gradedSubmissions.length > 0) {
      const totalGrade = gradedSubmissions.reduce((sum, submission) => {
        const populatedSubmission = submission as any;
        const maxGrade = populatedSubmission.assignmentId?.maxGrade || 100;
        return sum + (submission.grade || 0);
      }, 0);
      averageGrade = Math.round(totalGrade / gradedSubmissions.length);
    }

    const assignmentCompletion = totalAssignments > 0 
      ? Math.round((submittedAssignments / totalAssignments) * 100)
      : 0;

    const gradingRate = submittedAssignments > 0 
      ? Math.round((gradedAssignments / submittedAssignments) * 100)
      : 0;

    return {
      totalAssignments,
      submittedAssignments,
      gradedAssignments,
      averageGrade,
      assignmentCompletion,
      gradingRate
    };
  }

  /**
   * Hedef istatistiklerini hesaplar
   */
  private static async calculateGoalStats(studentId: string, startDate: Date, endDate: Date) {
    // Tüm hedefleri al (tarih aralığında oluşturulan veya güncellenen)
    const allGoals = await Goal.find({
      studentId,
      $or: [
        { createdAt: { $gte: startDate, $lte: endDate } },
        { updatedAt: { $gte: startDate, $lte: endDate } }
      ]
    });

    const totalGoals = allGoals.length;

    // Bu hedeflerden tamamlananları say
    const completedGoals = allGoals.filter(goal => goal.status === 'completed').length;

    // İlerleme yüzdesi hesapla
    const goalsProgress = totalGoals > 0 
      ? Math.round((completedGoals / totalGoals) * 100)
      : 0;

    return {
      totalGoals,
      completedGoals,
      goalsProgress
    };
  }

  /**
   * Branş istatistiklerini hesaplar
   */
  private static async calculateSubjectStats(studentId: string, startDate: Date, endDate: Date) {
    const assignments = await Assignment.find({
      studentId,
      dueDate: { $gte: startDate, $lte: endDate }
    }).populate('classId', 'name');

    // Branşlara göre grupla
    const subjectGroups: { [key: string]: PopulatedAssignment[] } = {};
    assignments.forEach(assignment => {
      const populatedAssignment = assignment as any;
      const subjectName = populatedAssignment.classId?.name || 'Genel';
      if (!subjectGroups[subjectName]) {
        subjectGroups[subjectName] = [];
      }
      subjectGroups[subjectName].push(assignment as any);
    });

    const subjectStats = [];
    for (const [subjectName, subjectAssignments] of Object.entries(subjectGroups)) {
      const assignmentIds = subjectAssignments.map(a => a._id.toString());
      
      const submittedInSubject = await AssignmentSubmission.countDocuments({
        assignmentId: { $in: assignmentIds },
        studentId,
        status: { $in: ['submitted', 'graded', 'completed'] }
      });

      const gradedInSubject = await AssignmentSubmission.countDocuments({
        assignmentId: { $in: assignmentIds },
        studentId,
        status: { $in: ['graded', 'completed'] }
      });

      // Bu branştaki ortalama not
      const gradedSubmissions = await AssignmentSubmission.find({
        assignmentId: { $in: assignmentIds },
        studentId,
        status: { $in: ['graded', 'completed'] },
        grade: { $exists: true, $ne: null }
      }).populate('assignmentId', 'maxGrade');

      let averageGrade = 0;
      if (gradedSubmissions.length > 0) {
        const totalGrade = gradedSubmissions.reduce((sum, submission) => {
          const populatedSubmission = submission as any;
          const maxGrade = populatedSubmission.assignmentId?.maxGrade || 100;
          return sum + (submission.grade || 0);
        }, 0);
        averageGrade = Math.round(totalGrade / gradedSubmissions.length);
      }

      const completionRate = subjectAssignments.length > 0 
        ? Math.round((submittedInSubject / subjectAssignments.length) * 100)
        : 0;

      subjectStats.push({
        name: subjectName,
        totalAssignments: subjectAssignments.length,
        submittedAssignments: submittedInSubject,
        gradedAssignments: gradedInSubject,
        averageGrade,
        completionRate
      });
    }

    return subjectStats;
  }

  /**
   * Aylık ilerleme verilerini hesaplar
   */
  private static async calculateMonthlyProgress(studentId: string, startDate: Date, endDate: Date) {
    const monthlyProgress = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const monthAssignments = await Assignment.countDocuments({
        studentId,
        dueDate: { $gte: monthStart, $lte: monthEnd }
      });

      const monthGoalsCompleted = await Goal.countDocuments({
        studentId,
        status: 'completed',
        updatedAt: { $gte: monthStart, $lte: monthEnd }
      });

      // Bu ayın ortalama notu
      const monthSubmissions = await AssignmentSubmission.find({
        studentId,
        status: { $in: ['graded', 'completed'] },
        grade: { $exists: true, $ne: null },
        submittedAt: { $gte: monthStart, $lte: monthEnd }
      }).populate('assignmentId', 'maxGrade');

      let monthAverageGrade = 0;
      if (monthSubmissions.length > 0) {
        const totalGrade = monthSubmissions.reduce((sum, submission) => {
          const populatedSubmission = submission as any;
          const maxGrade = populatedSubmission.assignmentId?.maxGrade || 100;
          return sum + (submission.grade || 0);
        }, 0);
        monthAverageGrade = Math.round(totalGrade / monthSubmissions.length);
      }

      monthlyProgress.push({
        month: monthStart.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
        assignments: monthAssignments,
        goalsCompleted: monthGoalsCompleted,
        averageGrade: monthAverageGrade
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return monthlyProgress;
  }

  /**
   * Son ödevleri getirir
   */
  private static async getRecentAssignments(studentId: string, limit: number) {
    const assignments = await Assignment.find({ studentId })
      .populate('classId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);

    const recentAssignments = [];
    for (const assignment of assignments) {
      const submission = await AssignmentSubmission.findOne({
        assignmentId: assignment._id,
        studentId
      });

      recentAssignments.push({
        title: assignment.title,
        dueDate: assignment.dueDate.toISOString(),
        status: submission?.status || 'pending',
        grade: submission?.grade,
        maxGrade: assignment.maxGrade
      });
    }

    return recentAssignments;
  }

  /**
   * Hedefleri getirir
   */
  private static async getGoals(studentId: string, limit: number) {
    const goals = await Goal.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return goals.map(goal => ({
      title: goal.title,
      description: goal.description,
      status: goal.status,
      createdAt: goal.createdAt.toISOString(),
      completedAt: goal.status === 'completed' ? goal.updatedAt.toISOString() : undefined
    }));
  }

  /**
   * İçgörüleri oluşturur
   */
  private static generateInsights(assignmentStats: any, goalStats: any, subjectStats: any[]) {
    const strengths = [];
    const areasForImprovement = [];
    const recommendations = [];

    // Güçlü yönler
    if (assignmentStats.assignmentCompletion >= 80) {
      strengths.push('Ödev teslim oranı yüksek');
    }
    if (assignmentStats.averageGrade >= 80) {
      strengths.push('Not ortalaması yüksek');
    }
    if (goalStats.goalsProgress >= 70) {
      strengths.push('Hedef tamamlama oranı iyi');
    }

    // Gelişim alanları
    if (assignmentStats.assignmentCompletion < 60) {
      areasForImprovement.push('Ödev teslim oranı düşük');
    }
    if (assignmentStats.averageGrade < 60) {
      areasForImprovement.push('Not ortalaması düşük');
    }
    if (goalStats.goalsProgress < 50) {
      areasForImprovement.push('Hedef tamamlama oranı düşük');
    }

    // Öneriler
    if (assignmentStats.assignmentCompletion < 80) {
      recommendations.push('Ödev teslim zamanlamasını iyileştirin');
    }
    if (assignmentStats.gradingRate < 90) {
      recommendations.push('Ödevlerin değerlendirilmesini hızlandırın');
    }
    if (goalStats.goalsProgress < 70) {
      recommendations.push('Hedef belirleme ve takip sürecini güçlendirin');
    }

    // Branş bazlı öneriler
    const weakSubjects = subjectStats.filter(s => s.completionRate < 60);
    if (weakSubjects.length > 0) {
      recommendations.push(`${weakSubjects.map(s => s.name).join(', ')} branşlarında ek çalışma önerilir`);
    }

    return {
      strengths: strengths.length > 0 ? strengths : ['Genel performans değerlendiriliyor'],
      areasForImprovement: areasForImprovement.length > 0 ? areasForImprovement : ['Tüm alanlar iyi durumda'],
      recommendations: recommendations.length > 0 ? recommendations : ['Mevcut performansı koruyun']
    };
  }

  /**
   * Genel performansı hesaplar
   */
  private static calculatePerformance(assignmentStats: any, goalStats: any, subjectStats: any[]) {
    const assignmentCompletion = assignmentStats.assignmentCompletion || 0;
    const averageGrade = assignmentStats.averageGrade || 0;
    const gradingRate = assignmentStats.gradingRate || 0;
    const goalsProgress = goalStats.goalsProgress || 0;

    // Branş ortalaması
    const subjectAverage = subjectStats.length > 0 
      ? subjectStats.reduce((sum, s) => sum + s.completionRate, 0) / subjectStats.length
      : 0;

    // Genel performans hesaplama - daha dengeli formül
    // Ödev tamamlama %40, ortalama not %30, hedef ilerlemesi %20, branş ortalaması %10
    const overallPerformance = Math.round(
      (assignmentCompletion * 0.4) + 
      (averageGrade * 0.3) + 
      (goalsProgress * 0.2) + 
      (subjectAverage * 0.1)
    );

    return {
      assignmentCompletion,
      averageGrade,
      gradingRate,
      goalsProgress,
      overallPerformance: Math.min(100, Math.max(0, overallPerformance)) // 0-100 arasında sınırla
    };
  }
}
