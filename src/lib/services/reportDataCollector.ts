import { User, Assignment, AssignmentSubmission, Goal, Class } from '@/lib/models';
import { ReportData } from './pdfGenerator';

export interface StudentAnalysisData {
  studentId: string;
  teacherId: string;
  startDate?: Date;
  endDate?: Date;
}

export class ReportDataCollector {
  public static async collectStudentData(analysisData: StudentAnalysisData): Promise<ReportData> {
    const { studentId, teacherId, startDate, endDate } = analysisData;
    
    // Set default date range (last 3 months)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 3);
    
    const dateFilter = {
      $gte: startDate || defaultStartDate,
      $lte: endDate || defaultEndDate
    };

    // Collect all data in parallel
    const [
      student,
      teacher,
      assignments,
      submissions,
      goals,
      studentClass
    ] = await Promise.all([
      this.getStudent(studentId),
      this.getTeacher(teacherId),
      this.getAssignments(studentId, dateFilter),
      this.getSubmissions(studentId, dateFilter),
      this.getGoals(studentId, dateFilter),
      this.getStudentClass(studentId)
    ]);

    // Calculate performance metrics
    const performance = this.calculatePerformance(assignments, submissions);
    const subjectStats = this.calculateSubjectStats(assignments, submissions);
    const monthlyProgress = this.calculateMonthlyProgress(assignments, submissions, goals, dateFilter);
    const goalsWithProgress = this.calculateGoalsProgress(goals);
    const assignmentsWithStatus = this.calculateAssignmentStatus(assignments, submissions);
    const recommendations = this.generateRecommendations(performance, subjectStats, goalsWithProgress);
    const strengths = this.identifyStrengths(performance, subjectStats);
    const areasForImprovement = this.identifyAreasForImprovement(performance, subjectStats);

    return {
      student: {
        _id: (student._id as any).toString(),
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        classId: studentClass?._id?.toString()
      },
      teacher: {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email
      },
      performance,
      subjectStats,
      monthlyProgress,
      goals: goalsWithProgress,
      assignments: assignmentsWithStatus,
      recommendations,
      strengths,
      areasForImprovement
    };
  }

  private static async getStudent(studentId: string) {
    const student = await User.findById(studentId).select('firstName lastName email classId');
    if (!student) {
      throw new Error('Öğrenci bulunamadı');
    }
    return student;
  }

  private static async getTeacher(teacherId: string) {
    const teacher = await User.findById(teacherId).select('firstName lastName email');
    if (!teacher) {
      throw new Error('Öğretmen bulunamadı');
    }
    return teacher;
  }

  private static async getAssignments(studentId: string, dateFilter: any) {
    return await Assignment.find({
      assignedTo: studentId,
      dueDate: dateFilter
    }).populate('createdBy', 'firstName lastName').sort({ dueDate: -1 });
  }

  private static async getSubmissions(studentId: string, dateFilter: any) {
    return await AssignmentSubmission.find({
      studentId,
      submittedAt: dateFilter
    }).populate('assignmentId').sort({ submittedAt: -1 });
  }

  private static async getGoals(studentId: string, dateFilter: any) {
    return await Goal.find({
      studentId,
      createdAt: dateFilter
    }).sort({ dueDate: -1 });
  }

  private static async getStudentClass(studentId: string) {
    const student = await User.findById(studentId).select('classId');
    if (student && (student as any).classId) {
      return await Class.findById((student as any).classId);
    }
    return null;
  }

  private static calculatePerformance(assignments: any[], submissions: any[]) {
    const totalAssignments = assignments.length;
    const submittedAssignments = submissions.length;
    const gradedAssignments = submissions.filter(s => s.grade !== null && s.grade !== undefined).length;
    
    const assignmentCompletion = totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 0;
    const gradingRate = submittedAssignments > 0 ? Math.round((gradedAssignments / submittedAssignments) * 100) : 0;
    
    const grades = submissions
      .filter(s => s.grade !== null && s.grade !== undefined)
      .map(s => s.grade);
    
    const averageGrade = grades.length > 0 
      ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length)
      : 0;

    // Calculate overall performance based on multiple factors
    const overallPerformance = Math.round(
      (assignmentCompletion * 0.4) + 
      (gradingRate * 0.3) + 
      (averageGrade * 0.3)
    );

    return {
      assignmentCompletion,
      goalsProgress: 0, // Will be calculated separately
      overallPerformance,
      averageGrade,
      totalAssignments,
      submittedAssignments,
      gradedAssignments,
      gradingRate
    };
  }

  private static calculateSubjectStats(assignments: any[], submissions: any[]) {
    const subjectMap = new Map<string, {
      totalAssignments: number;
      submittedAssignments: number;
      gradedAssignments: number;
      grades: number[];
    }>();

    // Process assignments
    assignments.forEach(assignment => {
      const subject = assignment.subject || 'Genel';
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, {
          totalAssignments: 0,
          submittedAssignments: 0,
          gradedAssignments: 0,
          grades: []
        });
      }
      subjectMap.get(subject)!.totalAssignments++;
    });

    // Process submissions
    submissions.forEach(submission => {
      if (submission.assignmentId) {
        const subject = submission.assignmentId.subject || 'Genel';
        if (subjectMap.has(subject)) {
          const stats = subjectMap.get(subject)!;
          stats.submittedAssignments++;
          if (submission.grade !== null && submission.grade !== undefined) {
            stats.gradedAssignments++;
            stats.grades.push(submission.grade);
          }
        }
      }
    });

    // Calculate completion percentages and average grades
    const subjectStats: Record<string, any> = {};
    subjectMap.forEach((stats, subject) => {
      const completion = stats.totalAssignments > 0 
        ? Math.round((stats.submittedAssignments / stats.totalAssignments) * 100)
        : 0;
      
      const averageGrade = stats.grades.length > 0
        ? Math.round(stats.grades.reduce((sum, grade) => sum + grade, 0) / stats.grades.length)
        : 0;

      subjectStats[subject] = {
        completion,
        averageGrade,
        totalAssignments: stats.totalAssignments,
        submittedAssignments: stats.submittedAssignments,
        gradedAssignments: stats.gradedAssignments
      };
    });

    return subjectStats;
  }

  private static calculateMonthlyProgress(assignments: any[], submissions: any[], goals: any[], dateFilter: any) {
    const monthlyData = new Map<string, {
      assignments: number;
      goalsCompleted: number;
      grades: number[];
    }>();

    // Process assignments by month
    assignments.forEach(assignment => {
      const month = assignment.dueDate.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { assignments: 0, goalsCompleted: 0, grades: [] });
      }
      monthlyData.get(month)!.assignments++;
    });

    // Process submissions by month
    submissions.forEach(submission => {
      const month = submission.submittedAt.toISOString().substring(0, 7);
      if (monthlyData.has(month) && submission.grade !== null && submission.grade !== undefined) {
        monthlyData.get(month)!.grades.push(submission.grade);
      }
    });

    // Process goals by month
    goals.forEach(goal => {
      if (goal.status === 'completed' && goal.completedAt) {
        const month = goal.completedAt.toISOString().substring(0, 7);
        if (monthlyData.has(month)) {
          monthlyData.get(month)!.goalsCompleted++;
        }
      }
    });

    // Convert to array and calculate averages
    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month: this.formatMonth(month),
      assignments: data.assignments,
      goalsCompleted: data.goalsCompleted,
      averageGrade: data.grades.length > 0 
        ? Math.round(data.grades.reduce((sum, grade) => sum + grade, 0) / data.grades.length)
        : 0
    })).sort((a, b) => b.month.localeCompare(a.month));
  }

  private static calculateGoalsProgress(goals: any[]) {
    return goals.map(goal => {
      let progress = 0;
      let status: 'completed' | 'in_progress' | 'pending' = 'pending';

      if (goal.status === 'completed') {
        progress = 100;
        status = 'completed';
      } else if (goal.status === 'in_progress') {
        progress = goal.progress || 0;
        status = 'in_progress';
      }

      return {
        title: goal.title,
        description: goal.description || '',
        progress,
        dueDate: goal.dueDate ? goal.dueDate.toLocaleDateString('tr-TR') : '',
        status
      };
    });
  }

  private static calculateAssignmentStatus(assignments: any[], submissions: any[]) {
    const submissionMap = new Map();
    submissions.forEach(submission => {
      submissionMap.set(submission.assignmentId._id.toString(), submission);
    });

    return assignments.map(assignment => {
      const submission = submissionMap.get(assignment._id.toString());
      let status: 'submitted' | 'graded' | 'pending' | 'late' = 'pending';
      
      if (submission) {
        if (submission.grade !== null && submission.grade !== undefined) {
          status = 'graded';
        } else {
          status = 'submitted';
        }
      } else if (assignment.dueDate < new Date()) {
        status = 'late';
      }

      return {
        title: assignment.title,
        subject: assignment.subject || 'Genel',
        dueDate: assignment.dueDate.toLocaleDateString('tr-TR'),
        submittedDate: submission ? submission.submittedAt.toLocaleDateString('tr-TR') : undefined,
        grade: submission?.grade,
        status
      };
    });
  }

  private static generateRecommendations(performance: any, subjectStats: any, goals: any[]) {
    const recommendations: string[] = [];
    
    // Performance-based recommendations
    if (performance.assignmentCompletion < 70) {
      recommendations.push('Ödev teslim oranını artırmak için düzenli çalışma planı oluşturulmalıdır.');
    }
    
    if (performance.averageGrade < 60) {
      recommendations.push('Not ortalamasını yükseltmek için ek ders desteği alınması önerilir.');
    }
    
    if (performance.gradingRate < 80) {
      recommendations.push('Ödevlerin daha hızlı teslim edilmesi için zaman yönetimi becerileri geliştirilmelidir.');
    }

    // Subject-based recommendations
    Object.entries(subjectStats).forEach(([subject, stats]: [string, any]) => {
      if (stats.completion < 60) {
        recommendations.push(`${subject} dersinde daha fazla çalışma yapılması önerilir.`);
      }
      if (stats.averageGrade < 50) {
        recommendations.push(`${subject} dersinde ek destek alınması faydalı olacaktır.`);
      }
    });

    // Goals-based recommendations
    const incompleteGoals = goals.filter(goal => goal.status !== 'completed');
    if (incompleteGoals.length > 0) {
      recommendations.push('Belirlenen hedeflere ulaşmak için daha sistematik bir yaklaşım benimsenmelidir.');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Mevcut performansı korumak için düzenli çalışmaya devam edilmelidir.');
    }

    return recommendations;
  }

  private static identifyStrengths(performance: any, subjectStats: any) {
    const strengths: string[] = [];
    
    if (performance.assignmentCompletion > 85) {
      strengths.push('Yüksek ödev teslim oranı');
    }
    
    if (performance.averageGrade > 80) {
      strengths.push('Yüksek not ortalaması');
    }
    
    if (performance.gradingRate > 90) {
      strengths.push('Hızlı ödev teslimi');
    }

    Object.entries(subjectStats).forEach(([subject, stats]: [string, any]) => {
      if (stats.completion > 80) {
        strengths.push(`${subject} dersinde yüksek performans`);
      }
    });

    return strengths;
  }

  private static identifyAreasForImprovement(performance: any, subjectStats: any) {
    const areas: string[] = [];
    
    if (performance.assignmentCompletion < 70) {
      areas.push('Ödev teslim oranı');
    }
    
    if (performance.averageGrade < 60) {
      areas.push('Not ortalaması');
    }
    
    if (performance.gradingRate < 70) {
      areas.push('Ödev teslim hızı');
    }

    Object.entries(subjectStats).forEach(([subject, stats]: [string, any]) => {
      if (stats.completion < 60) {
        areas.push(`${subject} dersinde performans`);
      }
    });

    return areas;
  }

  private static formatMonth(monthString: string): string {
    const [year, month] = monthString.split('-');
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
}

export default ReportDataCollector;
