import { User, Assignment, AssignmentSubmission, Class, Goal } from '@/lib/models';
import { ReportData } from './pdfGenerator';
import { safeIdToString } from '@/lib/utils/idHelper';

export interface StudentAnalysisData {
  studentId: string;
  teacherId: string;
  startDate?: Date;
  endDate?: Date;
}

export class ReportDataCollector {
  public static async collectStudentData(analysisData: StudentAnalysisData): Promise<ReportData> {
    const { studentId, teacherId, startDate, endDate } = analysisData;
    
    try {
      // Validate input parameters
      if (!studentId || !teacherId) {
        throw new Error('Student ID ve Teacher ID gerekli');
      }

      // Set default date range (last 3 months)
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setMonth(defaultStartDate.getMonth() - 3);
      
      const dateFilter = {
        $gte: startDate || defaultStartDate,
        $lte: endDate || defaultEndDate
      };

      console.log('ReportDataCollector: Starting data collection', {
        studentId,
        teacherId,
        dateFilter
      });

      // Collect all data in parallel with error handling
      const [
        student,
        teacher,
        assignments,
        submissions,
        goals,
        studentClass
      ] = await Promise.allSettled([
        this.getStudent(studentId),
        this.getTeacher(teacherId),
        this.getAssignments(studentId, dateFilter),
        this.getSubmissions(studentId, dateFilter),
        this.getGoals(studentId, dateFilter),
        this.getStudentClass(studentId)
      ]);

      // Check for critical errors
      if (student.status === 'rejected') {
        throw new Error(`Öğrenci bulunamadı: ${student.reason}`);
      }
      if (teacher.status === 'rejected') {
        throw new Error(`Öğretmen bulunamadı: ${teacher.reason}`);
      }

      // Extract successful results
      const studentData = student.status === 'fulfilled' ? student.value : null;
      const teacherData = teacher.status === 'fulfilled' ? teacher.value : null;
      const assignmentsData = assignments.status === 'fulfilled' ? assignments.value : [];
      const submissionsData = submissions.status === 'fulfilled' ? submissions.value : [];
      const goalsData = goals.status === 'fulfilled' ? goals.value : [];
      const studentClassData = studentClass.status === 'fulfilled' ? studentClass.value : null;

      if (!studentData) {
        throw new Error('Öğrenci verisi alınamadı');
      }
      if (!teacherData) {
        throw new Error('Öğretmen verisi alınamadı');
      }

      console.log('ReportDataCollector: Data collected successfully', {
        student: !!studentData,
        teacher: !!teacherData,
        assignments: assignmentsData.length,
        submissions: submissionsData.length,
        goals: goalsData.length,
        class: !!studentClassData
      });

      // Calculate performance metrics with error handling
      const performance = this.calculatePerformance(assignmentsData, submissionsData);
      const subjectStats = this.calculateSubjectStats(assignmentsData, submissionsData);
      const monthlyProgress = this.calculateMonthlyProgress(assignmentsData, submissionsData, goalsData, dateFilter);
      const goalsWithProgress = this.calculateGoalsProgress(goalsData);
      const assignmentsWithStatus = this.calculateAssignmentStatus(assignmentsData, submissionsData);
      const recommendations = this.generateRecommendations(performance, subjectStats, goalsWithProgress);
      const strengths = this.identifyStrengths(performance, subjectStats);
      const areasForImprovement = this.identifyAreasForImprovement(performance, subjectStats);

      const result = {
        student: {
          _id: safeIdToString(studentData._id),
          firstName: studentData.firstName || 'Bilinmeyen',
          lastName: studentData.lastName || 'Öğrenci',
          email: studentData.email || '',
          classId: studentClassData?._id?.toString(),
          isActive: studentData.isActive
        },
        teacher: {
          _id: safeIdToString(teacherData._id),
          firstName: teacherData.firstName || 'Bilinmeyen',
          lastName: teacherData.lastName || 'Öğretmen',
          email: teacherData.email || '',
          isActive: teacherData.isActive
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

      console.log('ReportDataCollector: Report data generated successfully');
      return result;

    } catch (error) {
      console.error('ReportDataCollector: Error collecting student data', error);
      throw new Error(`Veri toplama hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  private static async getStudent(studentId: string) {
    try {
      console.log('ReportDataCollector: Getting student', studentId);
      
      // Validate student ID format
      if (!studentId || typeof studentId !== 'string') {
        throw new Error('Geçersiz öğrenci ID formatı');
      }

      // Check if student exists and is active
      const student = await User.findById(studentId).select('firstName lastName email classId role isActive');
      console.log('ReportDataCollector: Student query result', { 
        exists: !!student,
        id: student?._id,
        name: student?.firstName,
        role: student?.role,
        isActive: student?.isActive
      });
      
      if (!student) {
        throw new Error(`Öğrenci bulunamadı: ${studentId}`);
      }

      if (student.role !== 'student') {
        throw new Error(`Kullanıcı öğrenci değil: ${student.role}`);
      }

      if (!student.isActive) {
        throw new Error(`Öğrenci aktif değil: ${studentId}`);
      }
      
      console.log('ReportDataCollector: Student found', { 
        id: student._id, 
        name: student.firstName,
        role: student.role,
        email: student.email,
        isActive: student.isActive
      });
      return student;
    } catch (error) {
      console.error('ReportDataCollector: Error getting student', error);
      throw new Error(`Öğrenci verisi alınamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  private static async getTeacher(teacherId: string) {
    try {
      console.log('ReportDataCollector: Getting teacher', teacherId);
      
      // Validate teacher ID format
      if (!teacherId || typeof teacherId !== 'string') {
        throw new Error('Geçersiz öğretmen ID formatı');
      }

      const teacher = await User.findById(teacherId).select('firstName lastName email role isActive');
      console.log('ReportDataCollector: Teacher query result', { 
        exists: !!teacher,
        id: teacher?._id,
        name: teacher?.firstName,
        role: teacher?.role,
        isActive: teacher?.isActive
      });

      if (!teacher) {
        throw new Error(`Öğretmen bulunamadı: ${teacherId}`);
      }

      if (teacher.role !== 'teacher') {
        throw new Error(`Kullanıcı öğretmen değil: ${teacher.role}`);
      }

      if (!teacher.isActive) {
        throw new Error(`Öğretmen aktif değil: ${teacherId}`);
      }

      console.log('ReportDataCollector: Teacher found', { 
        id: teacher._id, 
        name: teacher.firstName,
        role: teacher.role,
        isActive: teacher.isActive
      });
      return teacher;
    } catch (error) {
      console.error('ReportDataCollector: Error getting teacher', error);
      throw new Error(`Öğretmen verisi alınamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  private static async getAssignments(studentId: string, dateFilter: any) {
    try {
      console.log('ReportDataCollector: Getting assignments', { studentId, dateFilter });
      const assignments = await Assignment.find({
        studentId: studentId,
        dueDate: dateFilter
      }).populate('teacherId', 'firstName lastName').sort({ dueDate: -1 });
      console.log('ReportDataCollector: Assignments found', assignments.length);
      return assignments;
    } catch (error) {
      console.error('ReportDataCollector: Error getting assignments', error);
      return []; // Return empty array instead of throwing
    }
  }

  private static async getSubmissions(studentId: string, dateFilter: any) {
    try {
      console.log('ReportDataCollector: Getting submissions', { studentId, dateFilter });
      const submissions = await AssignmentSubmission.find({
        studentId,
        submittedAt: dateFilter
      }).populate('assignmentId').sort({ submittedAt: -1 });
      console.log('ReportDataCollector: Submissions found', submissions.length);
      return submissions;
    } catch (error) {
      console.error('ReportDataCollector: Error getting submissions', error);
      return []; // Return empty array instead of throwing
    }
  }

  private static async getGoals(studentId: string, dateFilter: any) {
    try {
      console.log('ReportDataCollector: Getting goals', { studentId, dateFilter });
      const goals = await Goal.find({
        studentId,
        createdAt: dateFilter
      }).sort({ targetDate: -1 });
      console.log('ReportDataCollector: Goals found', goals.length);
      return goals;
    } catch (error) {
      console.error('ReportDataCollector: Error getting goals', error);
      return []; // Return empty array instead of throwing
    }
  }

  private static async getStudentClass(studentId: string) {
    try {
      console.log('ReportDataCollector: Getting student class', studentId);
      const student = await User.findById(studentId).select('classId');
      if (student && student.classId) {
        const classData = await Class.findById(student.classId);
        console.log('ReportDataCollector: Class found', classData ? classData._id : 'null');
        return classData;
      }
      console.log('ReportDataCollector: No class found for student');
      return null;
    } catch (error) {
      console.error('ReportDataCollector: Error getting student class', error);
      return null; // Return null instead of throwing
    }
  }

  private static calculatePerformance(assignments: any[], submissions: any[]) {
    try {
      console.log('ReportDataCollector: Calculating performance', {
        assignments: assignments.length,
        submissions: submissions.length
      });

      const totalAssignments = assignments.length;
      const submittedAssignments = submissions.length;
      const gradedAssignments = submissions.filter(s => s && s.grade !== null && s.grade !== undefined).length;
      
      const assignmentCompletion = totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 0;
      const gradingRate = submittedAssignments > 0 ? Math.round((gradedAssignments / submittedAssignments) * 100) : 0;
      
      const grades = submissions
        .filter(s => s && s.grade !== null && s.grade !== undefined)
        .map(s => Number(s.grade))
        .filter(grade => !isNaN(grade));
      
      const averageGrade = grades.length > 0 
        ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length)
        : 0;

      // Calculate overall performance based on multiple factors
      const overallPerformance = Math.round(
        (assignmentCompletion * 0.4) + 
        (gradingRate * 0.3) + 
        (averageGrade * 0.3)
      );

      const result = {
        assignmentCompletion: Math.max(0, Math.min(100, assignmentCompletion)),
        goalsProgress: 0, // Will be calculated separately
        overallPerformance: Math.max(0, Math.min(100, overallPerformance)),
        averageGrade: Math.max(0, Math.min(100, averageGrade)),
        totalAssignments,
        submittedAssignments,
        gradedAssignments,
        gradingRate: Math.max(0, Math.min(100, gradingRate))
      };

      console.log('ReportDataCollector: Performance calculated', result);
      return result;
    } catch (error) {
      console.error('ReportDataCollector: Error calculating performance', error);
      return {
        assignmentCompletion: 0,
        goalsProgress: 0,
        overallPerformance: 0,
        averageGrade: 0,
        totalAssignments: 0,
        submittedAssignments: 0,
        gradedAssignments: 0,
        gradingRate: 0
      };
    }
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
        dueDate: goal.targetDate ? goal.targetDate.toLocaleDateString('tr-TR') : '',
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

