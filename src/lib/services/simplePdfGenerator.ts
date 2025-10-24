import jsPDF from 'jspdf';
import { StudentReportData } from '@/lib/types/report';

export class SimplePdfGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number = 280; // A4 page height in mm
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF();
    this.setupDocument();
  }

  private setupDocument(): void {
    this.doc.setFont('helvetica');
    this.doc.setFontSize(12);
  }

  public async generateReport(reportData: StudentReportData): Promise<Buffer> {
    try {
      console.log('SimplePdfGenerator: Starting PDF generation');
      
      // Validate report data
      if (!reportData) {
        throw new Error('Rapor verisi bulunamadı');
      }
      
      if (!reportData.student) {
        throw new Error('Öğrenci bilgileri bulunamadı');
      }
      
      if (!reportData.teacher) {
        throw new Error('Öğretmen bilgileri bulunamadı');
      }
      
      this.currentY = this.margin;
      
      // Add all sections with error handling
      try {
        this.addHeader(reportData);
        this.addStudentInfo(reportData);
        this.addPerformanceSummary(reportData);
        this.addStatistics(reportData);
        this.addSubjectStatistics(reportData);
        this.addMonthlyProgress(reportData);
        this.addRecentAssignments(reportData);
        this.addGoals(reportData);
        this.addInsights(reportData);
        this.addFooter();
      } catch (sectionError) {
        console.error('SimplePdfGenerator: Error in section generation', sectionError);
        throw new Error(`PDF bölümü oluşturma hatası: ${sectionError instanceof Error ? sectionError.message : 'Bilinmeyen hata'}`);
      }
      
      console.log('SimplePdfGenerator: PDF generation completed successfully');
      
      const pdfOutput = this.doc.output('arraybuffer') as ArrayBuffer;
      return Buffer.from(pdfOutput);
      
    } catch (error) {
      console.error('SimplePdfGenerator: Error generating PDF', error);
      throw new Error(`PDF oluşturma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  private addHeader(reportData: StudentReportData): void {
    // Title
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ÖĞRENCİ PERFORMANS RAPORU', this.margin, this.currentY);
    this.currentY += 15;

    // Date
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const reportDate = new Date(reportData.generatedAt).toLocaleDateString('tr-TR');
    this.doc.text(`Rapor Tarihi: ${reportDate}`, this.margin, this.currentY);
    this.currentY += 10;

    // Period
    const startDate = new Date(reportData.period.startDate).toLocaleDateString('tr-TR');
    const endDate = new Date(reportData.period.endDate).toLocaleDateString('tr-TR');
    this.doc.text(`Dönem: ${startDate} - ${endDate}`, this.margin, this.currentY);
    this.currentY += 15;

    // Line separator
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, 190, this.currentY);
    this.currentY += 10;
  }

  private addStudentInfo(reportData: StudentReportData): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ÖĞRENCİ BİLGİLERİ', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`Ad Soyad: ${reportData.student.firstName} ${reportData.student.lastName}`, this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.text(`E-posta: ${reportData.student.email}`, this.margin, this.currentY);
    this.currentY += 6;
    
    if (reportData.student.class) {
      this.doc.text(`Sınıf: ${reportData.student.class}`, this.margin, this.currentY);
      this.currentY += 6;
    }

    this.doc.text(`Öğretmen: ${reportData.teacher.firstName} ${reportData.teacher.lastName}`, this.margin, this.currentY);
    this.currentY += 15;
  }

  private addPerformanceSummary(reportData: StudentReportData): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PERFORMANS ÖZETİ', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');

    const performance = reportData.performance;
    
    this.doc.text(`Ödev Teslim Oranı: %${performance.assignmentCompletion}`, this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.text(`Ortalama Not: ${performance.averageGrade}/100`, this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.text(`Değerlendirme Oranı: %${performance.gradingRate}`, this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.text(`Hedef İlerlemesi: %${performance.goalsProgress}`, this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.text(`Genel Performans: %${performance.overallPerformance}`, this.margin, this.currentY);
    this.currentY += 15;
  }

  private addStatistics(reportData: StudentReportData): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('İSTATİSTİKLER', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');

    const stats = reportData.statistics;
    
    this.doc.text(`Toplam Ödev: ${stats.totalAssignments}`, this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.text(`Teslim Edilen: ${stats.submittedAssignments}`, this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.text(`Değerlendirilen: ${stats.gradedAssignments}`, this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.text(`Bekleyen: ${stats.pendingAssignments}`, this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.text(`Toplam Hedef: ${stats.totalGoals}`, this.margin, this.currentY);
    this.currentY += 6;
    
    this.doc.text(`Tamamlanan Hedef: ${stats.completedGoals}`, this.margin, this.currentY);
    this.currentY += 15;
  }

  private addSubjectStatistics(reportData: StudentReportData): void {
    if (reportData.subjects.length === 0) return;

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('BRANŞ İSTATİSTİKLERİ', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    // Table header
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Branş', this.margin, this.currentY);
    this.doc.text('Ödev', this.margin + 40, this.currentY);
    this.doc.text('Teslim', this.margin + 60, this.currentY);
    this.doc.text('Değerlendirme', this.margin + 80, this.currentY);
    this.doc.text('Ortalama', this.margin + 120, this.currentY);
    this.doc.text('Oran %', this.margin + 150, this.currentY);
    this.currentY += 8;

    // Table rows
    this.doc.setFont('helvetica', 'normal');
    for (const subject of reportData.subjects) {
      if (this.currentY > this.pageHeight - 20) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      this.doc.text(subject.name.length > 15 ? subject.name.substring(0, 15) + '...' : subject.name, this.margin, this.currentY);
      this.doc.text(subject.assignmentsTotal.toString(), this.margin + 40, this.currentY);
      this.doc.text(subject.assignmentsCompleted.toString(), this.margin + 60, this.currentY);
      this.doc.text(subject.assignmentsCompleted.toString(), this.margin + 80, this.currentY);
      this.doc.text(subject.averageGrade.toString(), this.margin + 120, this.currentY);
      const completionRate = subject.assignmentsTotal > 0 ? Math.round((subject.assignmentsCompleted / subject.assignmentsTotal) * 100) : 0;
      this.doc.text(completionRate.toString() + '%', this.margin + 150, this.currentY);
      this.currentY += 6;
    }

    this.currentY += 10;
  }

  private addMonthlyProgress(reportData: StudentReportData): void {
    if (reportData.monthlyProgress.length === 0) return;

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('AYLIK İLERLEME', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    // Table header
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Ay', this.margin, this.currentY);
    this.doc.text('Ödev', this.margin + 40, this.currentY);
    this.doc.text('Hedef', this.margin + 60, this.currentY);
    this.doc.text('Ortalama', this.margin + 80, this.currentY);
    this.currentY += 8;

    // Table rows
    this.doc.setFont('helvetica', 'normal');
    for (const month of reportData.monthlyProgress) {
      if (this.currentY > this.pageHeight - 20) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      this.doc.text(month.month, this.margin, this.currentY);
      this.doc.text(month.assignmentsCompleted.toString(), this.margin + 40, this.currentY);
      this.doc.text(month.goalsAchieved.toString(), this.margin + 60, this.currentY);
      this.doc.text(month.averageGrade.toString(), this.margin + 80, this.currentY);
      this.currentY += 6;
    }

    this.currentY += 10;
  }

  private addRecentAssignments(reportData: StudentReportData): void {
    if (reportData.recentAssignments.length === 0) return;

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SON ÖDEVLER', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    for (const assignment of reportData.recentAssignments.slice(0, 5)) {
      if (this.currentY > this.pageHeight - 20) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      const dueDate = new Date(assignment.dueDate).toLocaleDateString('tr-TR');
      const status = this.getStatusText(assignment.status);
      const gradeText = assignment.grade ? ` (${assignment.grade}/${assignment.maxGrade})` : '';
      
      this.doc.text(`${assignment.title} - ${dueDate} - ${status}${gradeText}`, this.margin, this.currentY);
      this.currentY += 6;
    }

    this.currentY += 10;
  }

  private addGoals(reportData: StudentReportData): void {
    if (reportData.goals.length === 0) return;

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('HEDEFLER', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    for (const goal of reportData.goals.slice(0, 5)) {
      if (this.currentY > this.pageHeight - 20) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      const status = this.getGoalStatusText(goal.status);
      this.doc.text(`${goal.title} - ${status}`, this.margin, this.currentY);
      this.currentY += 6;
    }

    this.currentY += 10;
  }

  private addInsights(reportData: StudentReportData): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('İÇGÖRÜLER VE ÖNERİLER', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');

    // Güçlü yönler
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Güçlü Yönler:', this.margin, this.currentY);
    this.currentY += 6;

    this.doc.setFont('helvetica', 'normal');
    for (const strength of reportData.insights.strengths) {
      this.doc.text(`• ${strength}`, this.margin + 5, this.currentY);
      this.currentY += 5;
    }

    this.currentY += 5;

    // Gelişim alanları
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Gelişim Alanları:', this.margin, this.currentY);
    this.currentY += 6;

    this.doc.setFont('helvetica', 'normal');
    for (const area of reportData.insights.areasForImprovement) {
      this.doc.text(`• ${area}`, this.margin + 5, this.currentY);
      this.currentY += 5;
    }

    this.currentY += 5;

    // Öneriler
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Öneriler:', this.margin, this.currentY);
    this.currentY += 6;

    this.doc.setFont('helvetica', 'normal');
    for (const recommendation of reportData.insights.recommendations) {
      this.doc.text(`• ${recommendation}`, this.margin + 5, this.currentY);
      this.currentY += 5;
    }
  }

  private addFooter(): void {
    const pageCount = (this.doc as any).getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Sayfa ${i} / ${pageCount}`, 190, 290, { align: 'right' });
      this.doc.text('Hedefly Öğrenci Koçluk Platformu', this.margin, 290);
    }
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'submitted': return 'Teslim Edildi';
      case 'graded': return 'Değerlendirildi';
      case 'completed': return 'Tamamlandı';
      default: return 'Bilinmiyor';
    }
  }

  private getGoalStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'in_progress': return 'Devam Ediyor';
      case 'completed': return 'Tamamlandı';
      default: return 'Bilinmiyor';
    }
  }
}
