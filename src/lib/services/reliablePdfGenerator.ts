import { jsPDF } from 'jspdf';

export interface ReliableReportData {
  student: {
    firstName: string;
    lastName: string;
    email: string;
    class?: string;
  };
  teacher: {
    firstName: string;
    lastName: string;
    email: string;
  };
  reportDate: string;
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
  subjectStats: Array<{
    subject: string;
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
    status: string;
    dueDate: string;
  }>;
  assignments: Array<{
    title: string;
    subject: string;
    dueDate: string;
    submittedDate?: string;
    grade?: number;
    status: string;
  }>;
  insights: {
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
  };
}

export class ReliablePdfGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number = 280;
  private margin: number = 20;
  private pageWidth: number = 210;
  private lineHeight: number = 6;

  constructor() {
    this.doc = new jsPDF();
    this.setupDocument();
  }

  private setupDocument(): void {
    this.doc.setFont('helvetica');
    this.doc.setFontSize(12);
  }

  public async generateReport(reportData: ReliableReportData): Promise<Buffer> {
    try {
      console.log('ReliablePdfGenerator: Starting PDF generation');
      
      // Reset position
      this.currentY = 20;
      
      // Add all sections
      this.addHeader(reportData);
      this.addStudentInfo(reportData);
      this.addPerformanceSummary(reportData);
      this.addSubjectStatistics(reportData);
      this.addMonthlyProgress(reportData);
      this.addGoalsSection(reportData);
      this.addAssignmentsSection(reportData);
      this.addInsightsSection(reportData);
      this.addFooter();
      
      console.log('ReliablePdfGenerator: PDF generation completed successfully');
      
      const pdfOutput = this.doc.output('arraybuffer');
      return Buffer.from(pdfOutput);
      
    } catch (error) {
      console.error('ReliablePdfGenerator: Error generating PDF', error);
      throw new Error(`PDF oluşturma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  private addHeader(reportData: ReliableReportData): void {
    // Title
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ÖĞRENCİ PERFORMANS RAPORU', this.margin, this.currentY);
    this.currentY += 15;

    // Student name
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      `${reportData.student.firstName} ${reportData.student.lastName}`,
      this.margin,
      this.currentY
    );
    this.currentY += 10;

    // Date
    this.doc.setFontSize(12);
    this.doc.text(
      `Rapor Tarihi: ${reportData.reportDate}`,
      this.margin,
      this.currentY
    );
    this.currentY += 15;

    // Line separator
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private addStudentInfo(reportData: ReliableReportData): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('GENEL BİLGİLER', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    // Student info
    this.doc.text(`Öğrenci: ${reportData.student.firstName} ${reportData.student.lastName}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.doc.text(`E-posta: ${reportData.student.email}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    if (reportData.student.class) {
      this.doc.text(`Sınıf: ${reportData.student.class}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }

    // Teacher info
    this.doc.text(`Öğretmen: ${reportData.teacher.firstName} ${reportData.teacher.lastName}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.doc.text(`E-posta: ${reportData.teacher.email}`, this.margin, this.currentY);
    this.currentY += 15;
  }

  private addPerformanceSummary(reportData: ReliableReportData): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PERFORMANS ÖZETİ', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    const performance = reportData.performance;
    
    // Performance metrics in a clean format
    const metrics = [
      ['Ödev Tamamlama Oranı', `${performance.assignmentCompletion}%`],
      ['Hedef İlerlemesi', `${performance.goalsProgress}%`],
      ['Genel Performans', `${performance.overallPerformance}%`],
      ['Ortalama Not', `${performance.averageGrade}/100`],
      ['Toplam Ödev', performance.totalAssignments.toString()],
      ['Teslim Edilen', performance.submittedAssignments.toString()],
      ['Değerlendirilen', performance.gradedAssignments.toString()],
      ['Değerlendirme Oranı', `${performance.gradingRate}%`]
    ];

    this.addSimpleTable(metrics);
    this.currentY += 10;
  }

  private addSubjectStatistics(reportData: ReliableReportData): void {
    if (reportData.subjectStats.length === 0) return;

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DERS BAZINDA PERFORMANS', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');

    // Subject table header
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Ders', this.margin, this.currentY);
    this.doc.text('Tamamlama', this.margin + 50, this.currentY);
    this.doc.text('Ortalama', this.margin + 80, this.currentY);
    this.doc.text('Toplam', this.margin + 110, this.currentY);
    this.doc.text('Teslim', this.margin + 140, this.currentY);
    this.currentY += 8;

    // Subject data
    this.doc.setFont('helvetica', 'normal');
    reportData.subjectStats.forEach(subject => {
      if (this.currentY > this.pageHeight - 20) {
        this.doc.addPage();
        this.currentY = 20;
      }

      this.doc.text(subject.subject.substring(0, 15), this.margin, this.currentY);
      this.doc.text(`${subject.completion}%`, this.margin + 50, this.currentY);
      this.doc.text(`${subject.averageGrade}`, this.margin + 80, this.currentY);
      this.doc.text(subject.totalAssignments.toString(), this.margin + 110, this.currentY);
      this.doc.text(subject.submittedAssignments.toString(), this.margin + 140, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 10;
  }

  private addMonthlyProgress(reportData: ReliableReportData): void {
    if (reportData.monthlyProgress.length === 0) return;

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('AYLIK İLERLEME', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');

    // Monthly progress table
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Ay', this.margin, this.currentY);
    this.doc.text('Ödevler', this.margin + 50, this.currentY);
    this.doc.text('Tamamlanan Hedefler', this.margin + 80, this.currentY);
    this.doc.text('Ortalama Not', this.margin + 130, this.currentY);
    this.currentY += 8;

    this.doc.setFont('helvetica', 'normal');
    reportData.monthlyProgress.slice(0, 6).forEach(month => {
      if (this.currentY > this.pageHeight - 20) {
        this.doc.addPage();
        this.currentY = 20;
      }

      this.doc.text(month.month, this.margin, this.currentY);
      this.doc.text(month.assignments.toString(), this.margin + 50, this.currentY);
      this.doc.text(month.goalsCompleted.toString(), this.margin + 80, this.currentY);
      this.doc.text(month.averageGrade.toString(), this.margin + 130, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 10;
  }

  private addGoalsSection(reportData: ReliableReportData): void {
    if (reportData.goals.length === 0) return;

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('HEDEFLER', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');

    reportData.goals.slice(0, 8).forEach(goal => {
      if (this.currentY > this.pageHeight - 20) {
        this.doc.addPage();
        this.currentY = 20;
      }

      const statusText = this.getStatusText(goal.status);
      
      this.doc.text(`• ${goal.title}`, this.margin, this.currentY);
      this.currentY += 5;
      this.doc.text(`  Durum: ${statusText} (${goal.progress}%)`, this.margin + 5, this.currentY);
      this.currentY += 5;
      
      if (goal.description) {
        const description = goal.description.length > 60 ? 
          goal.description.substring(0, 60) + '...' : goal.description;
        this.doc.text(`  Açıklama: ${description}`, this.margin + 5, this.currentY);
        this.currentY += 5;
      }
      
      this.currentY += 3;
    });

    this.currentY += 10;
  }

  private addAssignmentsSection(reportData: ReliableReportData): void {
    if (reportData.assignments.length === 0) return;

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ÖDEVLER', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');

    reportData.assignments.slice(0, 10).forEach(assignment => {
      if (this.currentY > this.pageHeight - 20) {
        this.doc.addPage();
        this.currentY = 20;
      }

      const statusText = this.getAssignmentStatusText(assignment.status);

      this.doc.text(`• ${assignment.title}`, this.margin, this.currentY);
      this.currentY += 5;
      this.doc.text(`  Ders: ${assignment.subject}`, this.margin + 5, this.currentY);
      this.currentY += 4;
      this.doc.text(`  Durum: ${statusText}`, this.margin + 5, this.currentY);
      this.currentY += 4;
      
      if (assignment.grade !== undefined) {
        this.doc.text(`  Not: ${assignment.grade}/100`, this.margin + 5, this.currentY);
        this.currentY += 4;
      }
      
      this.currentY += 3;
    });

    this.currentY += 10;
  }

  private addInsightsSection(reportData: ReliableReportData): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DEĞERLENDİRME VE ÖNERİLER', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    // Strengths
    if (reportData.insights.strengths.length > 0) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Güçlü Yönler:', this.margin, this.currentY);
      this.currentY += 6;
      
      this.doc.setFont('helvetica', 'normal');
      reportData.insights.strengths.forEach(strength => {
        if (this.currentY > this.pageHeight - 20) {
          this.doc.addPage();
          this.currentY = 20;
        }
        this.doc.text(`• ${strength}`, this.margin + 5, this.currentY);
        this.currentY += 5;
      });
      this.currentY += 5;
    }

    // Areas for improvement
    if (reportData.insights.areasForImprovement.length > 0) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Geliştirilmesi Gereken Alanlar:', this.margin, this.currentY);
      this.currentY += 6;
      
      this.doc.setFont('helvetica', 'normal');
      reportData.insights.areasForImprovement.forEach(area => {
        if (this.currentY > this.pageHeight - 20) {
          this.doc.addPage();
          this.currentY = 20;
        }
        this.doc.text(`• ${area}`, this.margin + 5, this.currentY);
        this.currentY += 5;
      });
      this.currentY += 5;
    }

    // Recommendations
    if (reportData.insights.recommendations.length > 0) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Öneriler:', this.margin, this.currentY);
      this.currentY += 6;
      
      this.doc.setFont('helvetica', 'normal');
      reportData.insights.recommendations.forEach(recommendation => {
        if (this.currentY > this.pageHeight - 20) {
          this.doc.addPage();
          this.currentY = 20;
        }
        this.doc.text(`• ${recommendation}`, this.margin + 5, this.currentY);
        this.currentY += 5;
      });
    }
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.text(
        `Sayfa ${i} / ${pageCount}`,
        this.pageWidth - 30,
        this.pageHeight - 10
      );
      this.doc.text(
        `Hedefly Eğitim Platformu - ${new Date().getFullYear()}`,
        this.margin,
        this.pageHeight - 10
      );
    }
  }

  private addSimpleTable(data: string[][]): void {
    const startY = this.currentY;
    
    data.forEach((row, index) => {
      this.doc.text(row[0], this.margin, startY + (index + 1) * this.lineHeight);
      this.doc.text(row[1], this.margin + 100, startY + (index + 1) * this.lineHeight);
    });

    this.currentY = startY + (data.length + 1) * this.lineHeight;
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'in_progress': return 'Devam Ediyor';
      case 'pending': return 'Beklemede';
      default: return 'Bilinmeyen';
    }
  }

  private getAssignmentStatusText(status: string): string {
    switch (status) {
      case 'submitted': return 'Teslim Edildi';
      case 'graded': return 'Değerlendirildi';
      case 'late': return 'Gecikmeli';
      case 'pending': return 'Beklemede';
      default: return 'Bilinmeyen';
    }
  }
}

export default ReliablePdfGenerator;
