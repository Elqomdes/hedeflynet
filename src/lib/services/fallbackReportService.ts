import { StudentReportData } from '@/lib/types/report';

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
        assignmentCompletion: 75, // Örnek veri
        averageGrade: 85, // Örnek veri
        gradingRate: 90, // Örnek veri
        goalsProgress: 60, // Örnek veri
        overallPerformance: 80 // Örnek veri
      },
      statistics: {
        totalAssignments: 12, // Örnek veri
        submittedAssignments: 9, // Örnek veri
        gradedAssignments: 8, // Örnek veri
        pendingAssignments: 3, // Örnek veri
        totalGoals: 5, // Örnek veri
        completedGoals: 3 // Örnek veri
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
        assignmentCompletion: 65, // Örnek veri
        averageGrade: 78, // Örnek veri
        gradingRate: 85, // Örnek veri
        goalsProgress: 45, // Örnek veri
        overallPerformance: 70 // Örnek veri
      },
      statistics: {
        totalAssignments: 10, // Örnek veri
        submittedAssignments: 7, // Örnek veri
        gradedAssignments: 6, // Örnek veri
        pendingAssignments: 3, // Örnek veri
        totalGoals: 4, // Örnek veri
        completedGoals: 2 // Örnek veri
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
