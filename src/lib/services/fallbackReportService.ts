import { StudentReportData } from '@/lib/models/ReportData';

export class FallbackReportService {
  /**
   * Fallback rapor verisi oluşturur (veritabanı bağlantısı olmadığında)
   */
  public static createFallbackReportData(
    studentId: string,
    teacherId: string,
    startDate: Date,
    endDate: Date
  ): StudentReportData {
    console.log('FallbackReportService: Creating fallback report data');
    
    return {
      student: {
        id: studentId,
        firstName: 'Öğrenci',
        lastName: 'Bilgisi',
        email: 'email@example.com',
        class: 'Bilinmeyen Sınıf'
      },
      teacher: {
        id: teacherId,
        firstName: 'Öğretmen',
        lastName: 'Bilgisi',
        email: 'teacher@example.com'
      },
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      performance: {
        assignmentCompletion: 0,
        averageGrade: 0,
        gradingRate: 0,
        goalsProgress: 0,
        overallPerformance: 0
      },
      statistics: {
        totalAssignments: 0,
        submittedAssignments: 0,
        gradedAssignments: 0,
        pendingAssignments: 0,
        totalGoals: 0,
        completedGoals: 0
      },
      subjects: [],
      monthlyProgress: [],
      recentAssignments: [],
      goals: [],
      insights: {
        strengths: ['Veri bulunamadı'],
        areasForImprovement: ['Veritabanı bağlantısı gerekli'],
        recommendations: ['Lütfen daha sonra tekrar deneyin']
      },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Hata durumunda basit rapor oluşturur
   */
  public static createErrorReportData(
    studentId: string,
    teacherId: string,
    errorMessage: string
  ): StudentReportData {
    console.log('FallbackReportService: Creating error report data');
    
    return {
      student: {
        id: studentId,
        firstName: 'Hata',
        lastName: 'Durumu',
        email: 'error@example.com',
        class: 'Bilinmeyen'
      },
      teacher: {
        id: teacherId,
        firstName: 'Öğretmen',
        lastName: 'Bilgisi',
        email: 'teacher@example.com'
      },
      period: {
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString()
      },
      performance: {
        assignmentCompletion: 0,
        averageGrade: 0,
        gradingRate: 0,
        goalsProgress: 0,
        overallPerformance: 0
      },
      statistics: {
        totalAssignments: 0,
        submittedAssignments: 0,
        gradedAssignments: 0,
        pendingAssignments: 0,
        totalGoals: 0,
        completedGoals: 0
      },
      subjects: [],
      monthlyProgress: [],
      recentAssignments: [],
      goals: [],
      insights: {
        strengths: ['Rapor oluşturulamadı'],
        areasForImprovement: [errorMessage],
        recommendations: ['Lütfen sistem yöneticisi ile iletişime geçin']
      },
      generatedAt: new Date().toISOString()
    };
  }
}
