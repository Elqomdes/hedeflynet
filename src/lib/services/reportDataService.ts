import connectDB from '@/lib/mongodb';
import { Assignment, AssignmentSubmission, User, Class } from '@/lib/models';
import { IUser } from '@/lib/models/User';
import { StudentReportData, ReportGenerationOptions } from '@/lib/types/report';
import { safeIdToString } from '@/lib/utils/idHelper';

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
      
      // Son ödevleri al
      const recentAssignments = await this.getRecentAssignments(studentId, 10);
      
      // Performans hesapla
      const performance = this.calculatePerformance(assignmentStats);

      return {
        student: {
          id: safeIdToString(student._id),
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          class: studentClass?.name
        },
        teacher: {
          id: safeIdToString(teacher._id),
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
          totalGoals: 0,
          completedGoals: 0
        },
        subjects: [],
        monthlyProgress: [],
        recentAssignments: recentAssignments.map(assignment => ({
          ...assignment,
          status: assignment.status as 'completed' | 'submitted' | 'graded' | 'pending',
          maxGrade: assignment.maxGrade || 100
        })),
        goals: [],
        insights: {
          strengths: ['Veri analizi tamamlandı'],
          areasForImprovement: ['Daha fazla ödev tamamlanabilir'],
          recommendations: ['Düzenli çalışma programı önerilir']
        },
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Report data collection error:', error);
      console.error('Error details:', {
        studentId,
        teacherId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Rapor verisi toplanamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  /**
   * Ödev istatistiklerini hesaplar
   */
  private static async calculateAssignmentStats(studentId: string, startDate: Date, endDate: Date) {
    try {
      console.log('ReportDataService: Calculating assignment stats', { studentId, startDate, endDate });
      
      // Tüm ödevleri al (tarih aralığındaki)
      const allAssignments = await Assignment.find({
        studentId,
        dueDate: { $gte: startDate, $lte: endDate }
      });

      const totalAssignments = allAssignments.length;
      console.log('ReportDataService: Found assignments', { totalAssignments });

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

      console.log('ReportDataService: Assignment counts', { submittedAssignments, gradedAssignments });

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

      const result = {
        totalAssignments,
        submittedAssignments,
        gradedAssignments,
        averageGrade,
        assignmentCompletion,
        gradingRate
      };

      console.log('ReportDataService: Assignment stats calculated', result);
      return result;
    } catch (error) {
      console.error('ReportDataService: Error calculating assignment stats', error);
      // Fallback değerler döndür
      return {
        totalAssignments: 0,
        submittedAssignments: 0,
        gradedAssignments: 0,
        averageGrade: 0,
        assignmentCompletion: 0,
        gradingRate: 0
      };
    }
  }


  /**
   * Son ödevleri getirir
   */
  private static async getRecentAssignments(studentId: string, limit: number) {
    try {
      console.log('ReportDataService: Getting recent assignments', { studentId, limit });
      
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

      console.log('ReportDataService: Recent assignments retrieved', { count: recentAssignments.length });
      return recentAssignments;
    } catch (error) {
      console.error('ReportDataService: Error getting recent assignments', error);
      return [];
    }
  }


  /**
   * Genel performansı hesaplar
   */
  private static calculatePerformance(assignmentStats: any) {
    const assignmentCompletion = assignmentStats.assignmentCompletion || 0;
    const averageGrade = assignmentStats.averageGrade || 0;
    const gradingRate = assignmentStats.gradingRate || 0;

    // Genel performans hesaplama - sadece ödev verilerine odaklan
    // Ödev tamamlama %50, değerlendirme oranı %30, ortalama not %20
    const overallPerformance = Math.round(
      (assignmentCompletion * 0.5) + 
      (gradingRate * 0.3) + 
      (averageGrade * 0.2)
    );

    return {
      assignmentCompletion,
      averageGrade,
      gradingRate,
      goalsProgress: 0, // Will be calculated separately if needed
      overallPerformance: Math.min(100, Math.max(0, overallPerformance)) // 0-100 arasında sınırla
    };
  }
}
