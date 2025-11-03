import { User, Assignment, AssignmentSubmission, Class, Goal } from '@/lib/models';
import { ReportData } from './pdfGenerator';
import { safeIdToString } from '@/lib/utils/idHelper';

export interface StudentAnalysisData {
  studentId: string;
  teacherId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface RobustReportData {
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    classId?: string;
    isActive: boolean;
  };
  teacher: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
  };
  performance: {
    assignmentCompletion: number;
    goalsProgress: number;
    overallPerformance: number;
    averageGrade: number;
    totalAssignments: number;
    submittedAssignments: number;
    gradedAssignments: number;
    gradingRate: number;
  };
  subjectStats: Record<string, {
    completion: number;
    averageGrade: number;
    totalAssignments: number;
    submittedAssignments: number;
    gradedAssignments: number;
  }>;
  monthlyProgress: Array<{
    month: string;
    assignments: number;
    goalsCompleted: number;
    averageGrade: number;
  }>;
  goals: Array<{
    title: string;
    description: string;
    progress: number;
    dueDate: string;
    status: 'completed' | 'in_progress' | 'pending';
  }>;
  assignments: Array<{
    title: string;
    subject: string;
    dueDate: string;
    submittedDate?: string;
    grade?: number;
    status: 'submitted' | 'graded' | 'pending' | 'late';
  }>;
  recommendations: string[];
  strengths: string[];
  areasForImprovement: string[];
  class?: {
    _id: string;
    name: string;
  };
}

export class RobustReportDataCollector {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  public static async collectStudentData(analysisData: StudentAnalysisData): Promise<RobustReportData> {
    const { studentId, teacherId, startDate, endDate } = analysisData;
    
    console.log('RobustReportDataCollector: Starting data collection', {
      studentId,
      teacherId,
      startDate,
      endDate
    });

    try {
      // Step 1: Validate inputs
      this.validateInputs(studentId, teacherId);

      // Step 2: Set date range
      const dateFilter = this.createDateFilter(startDate, endDate);

      // Step 3: Collect core data with retry mechanism
      const coreData = await this.collectCoreDataWithRetry(studentId, teacherId);
      
      // Step 4: Collect additional data
      const additionalData = await this.collectAdditionalData(studentId, dateFilter);

      // Step 5: Calculate metrics
      const metrics = this.calculateMetrics(additionalData);

      // Step 6: Generate insights
      const insights = this.generateInsights(metrics, additionalData);

      // Step 7: Build final report data
      const reportData: RobustReportData = {
        student: coreData.student,
        teacher: coreData.teacher,
        performance: metrics.performance,
        subjectStats: metrics.subjectStats,
        monthlyProgress: metrics.monthlyProgress,
        goals: additionalData.goals,
        assignments: additionalData.assignments,
        recommendations: insights.recommendations,
        strengths: insights.strengths,
        areasForImprovement: insights.areasForImprovement,
        class: coreData.class || undefined
      };

      console.log('RobustReportDataCollector: Data collection completed successfully');
      return reportData;

    } catch (error) {
      console.error('RobustReportDataCollector: Error collecting data', error);
      throw new Error(`Veri toplama hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  private static validateInputs(studentId: string, teacherId: string): void {
    if (!studentId || typeof studentId !== 'string' || studentId.length !== 24) {
      throw new Error('Geçersiz öğrenci ID formatı');
    }
    if (!teacherId || typeof teacherId !== 'string' || teacherId.length !== 24) {
      throw new Error('Geçersiz öğretmen ID formatı');
    }
  }

  private static createDateFilter(startDate?: Date, endDate?: Date) {
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 3);
    
    return {
      $gte: startDate || defaultStartDate,
      $lte: endDate || defaultEndDate
    };
  }

  private static async collectCoreDataWithRetry(studentId: string, teacherId: string) {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`RobustReportDataCollector: Attempt ${attempt} to collect core data`);
        
        const [student, teacher, classData] = await Promise.all([
          this.getStudentWithValidation(studentId),
          this.getTeacherWithValidation(teacherId),
          this.getStudentClass(studentId)
        ]);

        return { student, teacher, class: classData };
      } catch (error) {
        lastError = error as Error;
        console.warn(`RobustReportDataCollector: Attempt ${attempt} failed`, error);
        
        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY * attempt);
        }
      }
    }
    
    throw lastError || new Error('Core data collection failed after all retries');
  }

  private static async getStudentWithValidation(studentId: string) {
    const student = await User.findById(studentId).select('firstName lastName email role isActive classId');
    
    if (!student) {
      throw new Error(`Öğrenci bulunamadı: ${studentId}`);
    }
    
    if (student.role !== 'student') {
      throw new Error(`Kullanıcı öğrenci değil: ${student.role}`);
    }
    
    if (!student.isActive) {
      throw new Error(`Öğrenci aktif değil: ${studentId}`);
    }

    return {
      _id: safeIdToString(student._id),
      firstName: student.firstName || 'Bilinmeyen',
      lastName: student.lastName || 'Öğrenci',
      email: student.email || '',
      classId: student.classId?.toString(),
      isActive: student.isActive
    };
  }

  private static async getTeacherWithValidation(teacherId: string) {
    const teacher = await User.findById(teacherId).select('firstName lastName email role isActive');
    
    if (!teacher) {
      throw new Error(`Öğretmen bulunamadı: ${teacherId}`);
    }
    
    if (teacher.role !== 'teacher') {
      throw new Error(`Kullanıcı öğretmen değil: ${teacher.role}`);
    }
    
    if (!teacher.isActive) {
      throw new Error(`Öğretmen aktif değil: ${teacherId}`);
    }

    return {
      _id: safeIdToString(teacher._id),
      firstName: teacher.firstName || 'Bilinmeyen',
      lastName: teacher.lastName || 'Öğretmen',
      email: teacher.email || '',
      isActive: teacher.isActive
    };
  }

  private static async getStudentClass(studentId: string) {
    try {
      const student = await User.findById(studentId).select('classId');
      if (student && student.classId) {
        const classData = await Class.findById(student.classId);
        if (classData) {
          return {
            _id: safeIdToString(classData._id),
            name: classData.name || 'Bilinmeyen Sınıf'
          };
        }
      }
      return null;
    } catch (error) {
      console.warn('RobustReportDataCollector: Error getting student class', error);
      return null;
    }
  }

  private static async collectAdditionalData(studentId: string, dateFilter: any) {
    try {
      const [assignments, submissions, goals] = await Promise.allSettled([
        this.getAssignments(studentId, dateFilter),
        this.getSubmissions(studentId, dateFilter),
        this.getGoals(studentId, dateFilter)
      ]);

      return {
        assignments: assignments.status === 'fulfilled' ? assignments.value : [],
        submissions: submissions.status === 'fulfilled' ? submissions.value : [],
        goals: goals.status === 'fulfilled' ? goals.value : []
      };
    } catch (error) {
      console.warn('RobustReportDataCollector: Error collecting additional data', error);
      return { assignments: [], submissions: [], goals: [] };
    }
  }

  private static async getAssignments(studentId: string, dateFilter: any) {
    try {
      const assignments = await Assignment.find({
        $or: [
          { studentId: studentId },
          { 'classId.students': studentId }
        ],
        dueDate: dateFilter
      }).populate('teacherId', 'firstName lastName').sort({ dueDate: -1 });
      
      return assignments.map(assignment => ({
        _id: safeIdToString(assignment._id),
        title: assignment.title || 'Başlıksız Ödev',
        subject: assignment.tags && assignment.tags.length > 0 ? assignment.tags[0] : 'Genel',
        dueDate: assignment.dueDate ? assignment.dueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        teacherName: assignment.teacherId ? 
          `${(assignment.teacherId as any).firstName} ${(assignment.teacherId as any).lastName}` : 
          'Bilinmeyen Öğretmen',
        maxGrade: assignment.maxGrade || 100,
        status: 'pending' as const,
        submittedDate: undefined,
        grade: undefined
      }));
    } catch (error) {
      console.warn('RobustReportDataCollector: Error getting assignments', error);
      return [];
    }
  }

  private static async getSubmissions(studentId: string, dateFilter: any) {
    try {
      const submissions = await AssignmentSubmission.find({
        studentId,
        submittedAt: dateFilter
      }).populate('assignmentId').sort({ submittedAt: -1 });
      
      return submissions.map(submission => ({
        _id: safeIdToString(submission._id),
        assignmentId: submission.assignmentId?._id?.toString(),
        grade: submission.grade,
        submittedAt: submission.submittedAt,
        feedback: submission.feedback || ''
      }));
    } catch (error) {
      console.warn('RobustReportDataCollector: Error getting submissions', error);
      return [];
    }
  }

  private static async getGoals(studentId: string, dateFilter: any) {
    try {
      const goals = await Goal.find({
        studentId,
        createdAt: dateFilter
      }).sort({ createdAt: -1 });
      
      return goals.map(goal => ({
        title: goal.title || 'Başlıksız Hedef',
        description: goal.description || '',
        status: (goal.status === 'completed' ? 'completed' : goal.status === 'in_progress' ? 'in_progress' : 'pending') as 'completed' | 'in_progress' | 'pending',
        progress: goal.progress || 0,
        dueDate: goal.targetDate ? goal.targetDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }));
    } catch (error) {
      console.warn('RobustReportDataCollector: Error getting goals', error);
      return [];
    }
  }


  private static calculateMetrics(data: any) {
    const { assignments, submissions, goals } = data;

    // Ensure arrays exist and are valid
    const safeAssignments = Array.isArray(assignments) ? assignments : [];
    const safeSubmissions = Array.isArray(submissions) ? submissions : [];
    const safeGoals = Array.isArray(goals) ? goals : [];

    // Performance metrics
    const totalAssignments = safeAssignments.length;
    const submittedAssignments = safeSubmissions.length;
    const gradedAssignments = safeSubmissions.filter((s: any) => 
      s && s.grade !== null && s.grade !== undefined && !isNaN(s.grade)
    ).length;
    
    const assignmentCompletion = totalAssignments > 0 ? 
      Math.round((submittedAssignments / totalAssignments) * 100) : 0;
    
    const gradingRate = submittedAssignments > 0 ? 
      Math.round((gradedAssignments / submittedAssignments) * 100) : 0;

    const grades = safeSubmissions
      .filter((s: any) => s && s.grade !== null && s.grade !== undefined && !isNaN(s.grade))
      .map((s: any) => Number(s.grade));
    
    const averageGrade = grades.length > 0 ? 
      Math.round(grades.reduce((sum: number, grade: number) => sum + grade, 0) / grades.length) : 0;

    const completedGoals = safeGoals.filter((g: any) => g && g.status === 'completed').length;
    const goalsProgress = safeGoals.length > 0 ? 
      Math.round((completedGoals / safeGoals.length) * 100) : 0;

    const overallPerformance = Math.round(
      (assignmentCompletion * 0.4) + 
      (gradingRate * 0.3) + 
      (averageGrade * 0.3)
    );

    // Subject stats
    const subjectStats: Record<string, any> = {};
    safeAssignments.forEach((assignment: any) => {
      if (assignment) {
        const subject = assignment.subject || 'Genel';
        if (!subjectStats[subject]) {
          subjectStats[subject] = {
            totalAssignments: 0,
            submittedAssignments: 0,
            gradedAssignments: 0,
            grades: []
          };
        }
        subjectStats[subject].totalAssignments++;
      }
    });

    // Create a map of assignment IDs to subjects for faster lookup
    const assignmentSubjectMap = new Map();
    safeAssignments.forEach((assignment: any) => {
      if (assignment && assignment._id) {
        assignmentSubjectMap.set(assignment._id, assignment.subject || 'Genel');
      }
    });

    safeSubmissions.forEach((submission: any) => {
      if (submission && submission.assignmentId) {
        const subject = assignmentSubjectMap.get(submission.assignmentId) || 'Genel';
        if (subjectStats[subject]) {
          subjectStats[subject].submittedAssignments++;
          if (submission.grade !== null && submission.grade !== undefined && !isNaN(submission.grade)) {
            subjectStats[subject].gradedAssignments++;
            subjectStats[subject].grades.push(Number(submission.grade));
          }
        }
      }
    });

    // Calculate subject completion and average grades
    Object.keys(subjectStats).forEach(subject => {
      const stats = subjectStats[subject];
      stats.completion = stats.totalAssignments > 0 ? 
        Math.round((stats.submittedAssignments / stats.totalAssignments) * 100) : 0;
      stats.averageGrade = stats.grades.length > 0 ?
        Math.round(stats.grades.reduce((sum: number, grade: number) => sum + grade, 0) / stats.grades.length) : 0;
    });

    // Monthly progress
    const monthlyData = new Map<string, any>();
    
    // Process assignments
    safeAssignments.forEach((assignment: any) => {
      if (assignment && assignment.dueDate) {
        try {
          const dueDate = new Date(assignment.dueDate);
          const month = dueDate.toISOString().substring(0, 7);
          if (!monthlyData.has(month)) {
            monthlyData.set(month, { assignments: 0, goalsCompleted: 0, grades: [] });
          }
          monthlyData.get(month).assignments++;
        } catch (error) {
          console.warn('Invalid assignment due date:', assignment.dueDate);
        }
      }
    });

    // Process submissions
    safeSubmissions.forEach((submission: any) => {
      if (submission && submission.submittedAt) {
        try {
          const submittedDate = new Date(submission.submittedAt);
          const month = submittedDate.toISOString().substring(0, 7);
          if (monthlyData.has(month) && submission.grade !== null && submission.grade !== undefined && !isNaN(submission.grade)) {
            monthlyData.get(month).grades.push(Number(submission.grade));
          }
        } catch (error) {
          console.warn('Invalid submission date:', submission.submittedAt);
        }
      }
    });

    // Process goals
    safeGoals.forEach((goal: any) => {
      if (goal && goal.status === 'completed' && goal.completedAt) {
        try {
          const completedDate = new Date(goal.completedAt);
          const month = completedDate.toISOString().substring(0, 7);
          if (monthlyData.has(month)) {
            monthlyData.get(month).goalsCompleted++;
          }
        } catch (error) {
          console.warn('Invalid goal completion date:', goal.completedAt);
        }
      }
    });

    const monthlyProgress = Array.from(monthlyData.entries()).map(([month, data]) => ({
      month: this.formatMonth(month),
      assignments: data.assignments,
      goalsCompleted: data.goalsCompleted,
      averageGrade: data.grades.length > 0 ? 
        Math.round(data.grades.reduce((sum: number, grade: number) => sum + grade, 0) / data.grades.length) : 0
    })).sort((a, b) => b.month.localeCompare(a.month));

    return {
      performance: {
        assignmentCompletion: Math.max(0, Math.min(100, assignmentCompletion)),
        goalsProgress: Math.max(0, Math.min(100, goalsProgress)),
        overallPerformance: Math.max(0, Math.min(100, overallPerformance)),
        averageGrade: Math.max(0, Math.min(100, averageGrade)),
        totalAssignments,
        submittedAssignments,
        gradedAssignments,
        gradingRate: Math.max(0, Math.min(100, gradingRate))
      },
      subjectStats,
      monthlyProgress
    };
  }

  private static generateInsights(metrics: any, data: any) {
    const { performance, subjectStats } = metrics;
    const { goals } = data;

    const recommendations: string[] = [];
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];
    const safeGoals = Array.isArray(goals) ? goals : [];

    // Ensure performance and subjectStats exist
    if (!performance) {
      console.warn('Performance metrics not available for insights generation');
      return { recommendations: ['Veri yetersizliği nedeniyle öneri oluşturulamadı'], strengths: [], areasForImprovement: [] };
    }

    // Performance-based recommendations
    if (performance.assignmentCompletion < 70) {
      recommendations.push('Ödev teslim oranını artırmak için düzenli çalışma planı oluşturulmalıdır.');
      areasForImprovement.push('Ödev teslim oranı');
    } else if (performance.assignmentCompletion > 85) {
      strengths.push('Yüksek ödev teslim oranı');
    }

    if (performance.averageGrade < 60) {
      recommendations.push('Not ortalamasını yükseltmek için ek ders desteği alınması önerilir.');
      areasForImprovement.push('Not ortalaması');
    } else if (performance.averageGrade > 80) {
      strengths.push('Yüksek not ortalaması');
    }

    if (performance.gradingRate < 80) {
      recommendations.push('Ödevlerin daha hızlı teslim edilmesi için zaman yönetimi becerileri geliştirilmelidir.');
      areasForImprovement.push('Ödev teslim hızı');
    } else if (performance.gradingRate > 90) {
      strengths.push('Hızlı ödev teslimi');
    }

    // Subject-based recommendations
    Object.entries(subjectStats).forEach(([subject, stats]: [string, any]) => {
      if (stats.completion < 60) {
        recommendations.push(`${subject} dersinde daha fazla çalışma yapılması önerilir.`);
        areasForImprovement.push(`${subject} dersinde performans`);
      } else if (stats.completion > 80) {
        strengths.push(`${subject} dersinde yüksek performans`);
      }

      if (stats.averageGrade < 50) {
        recommendations.push(`${subject} dersinde ek destek alınması faydalı olacaktır.`);
      }
    });

    // Goals-based recommendations
    const incompleteGoals = safeGoals.filter((goal: any) => goal && goal.status !== 'completed');
    if (incompleteGoals.length > 0) {
      recommendations.push('Belirlenen hedeflere ulaşmak için daha sistematik bir yaklaşım benimsenmelidir.');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Mevcut performansı korumak için düzenli çalışmaya devam edilmelidir.');
    }

    return { recommendations, strengths, areasForImprovement };
  }

  private static formatMonth(monthString: string): string {
    const [year, month] = monthString.split('-');
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default RobustReportDataCollector;
