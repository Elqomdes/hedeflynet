import { jsPDF } from 'jspdf';
import { RobustReportData } from './robustReportDataCollector';

export class AdvancedPdfGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number = 280;
  private margin: number = 20;
  private pageWidth: number = 210;

  constructor() {
    this.doc = new jsPDF();
    this.setupDocument();
  }

  private setupDocument() {
    this.doc.setFont('helvetica');
    this.doc.setFontSize(12);
  }

  public async generateReport(reportData: RobustReportData): Promise<Buffer> {
    try {
      console.log('AdvancedPdfGenerator: Starting PDF generation');
      
      // Header
      this.addHeader(reportData);
      
      // Student and Teacher Info
      this.addStudentTeacherInfo(reportData);
      
      // Performance Overview
      this.addPerformanceOverview(reportData);
      
      // Subject Statistics
      this.addSubjectStatistics(reportData);
      
      // Monthly Progress
      this.addMonthlyProgress(reportData);
      
      // Goals Section
      this.addGoalsSection(reportData);
      
      // Assignments Section
      this.addAssignmentsSection(reportData);
      
      // Insights and Recommendations
      this.addInsightsSection(reportData);
      
      // Footer
      this.addFooter();
      
      console.log('AdvancedPdfGenerator: PDF generation completed');
      
      const pdfOutput = this.doc.output('arraybuffer');
      return Buffer.from(pdfOutput);
      
    } catch (error) {
      console.error('AdvancedPdfGenerator: Error generating PDF', error);
      throw new Error(`PDF oluşturma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  private addHeader(reportData: RobustReportData) {
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
      `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
      this.margin,
      this.currentY
    );
    this.currentY += 20;

    // Line separator
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private addStudentTeacherInfo(reportData: RobustReportData) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('GENEL BİLGİLER', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    // Student info
    this.doc.text(`Öğrenci: ${reportData.student.firstName} ${reportData.student.lastName}`, this.margin, this.currentY);
    this.currentY += 6;
    this.doc.text(`E-posta: ${reportData.student.email}`, this.margin, this.currentY);
    this.currentY += 6;
    
    if (reportData.class) {
      this.doc.text(`Sınıf: ${reportData.class.name}`, this.margin, this.currentY);
      this.currentY += 6;
    }

    // Teacher info
    this.doc.text(`Öğretmen: ${reportData.teacher.firstName} ${reportData.teacher.lastName}`, this.margin, this.currentY);
    this.currentY += 6;
    this.doc.text(`E-posta: ${reportData.teacher.email}`, this.margin, this.currentY);
    this.currentY += 15;
  }

  private addPerformanceOverview(reportData: RobustReportData) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PERFORMANS ÖZETİ', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    const performance = reportData.performance;
    
    // Performance metrics in a table format
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

    this.addTable(metrics, [80, 40]);
    this.currentY += 15;
  }

  private addSubjectStatistics(reportData: RobustReportData) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DERS BAZINDA PERFORMANS', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');

    const subjects = Object.keys(reportData.subjectStats);
    if (subjects.length === 0) {
      this.doc.text('Ders verisi bulunamadı.', this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

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
    subjects.forEach(subject => {
      const stats = reportData.subjectStats[subject];
      
      if (this.currentY > this.pageHeight - 20) {
        this.doc.addPage();
        this.currentY = 20;
      }

      this.doc.text(subject.substring(0, 15), this.margin, this.currentY);
      this.doc.text(`${stats.completion}%`, this.margin + 50, this.currentY);
      this.doc.text(`${stats.averageGrade}`, this.margin + 80, this.currentY);
      this.doc.text(stats.totalAssignments.toString(), this.margin + 110, this.currentY);
      this.doc.text(stats.submittedAssignments.toString(), this.margin + 140, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 10;
  }

  private addMonthlyProgress(reportData: RobustReportData) {
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

  private addGoalsSection(reportData: RobustReportData) {
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

      const statusText = goal.status === 'completed' ? 'Tamamlandı' : 
                       goal.status === 'in_progress' ? 'Devam Ediyor' : 'Beklemede';
      
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

  private addAssignmentsSection(reportData: RobustReportData) {
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

      const statusText = assignment.status === 'submitted' ? 'Teslim Edildi' :
                        assignment.status === 'graded' ? 'Değerlendirildi' :
                        assignment.status === 'late' ? 'Gecikmeli' : 'Beklemede';

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

  private addInsightsSection(reportData: RobustReportData) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DEĞERLENDİRME VE ÖNERİLER', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    // Strengths
    if (reportData.strengths.length > 0) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Güçlü Yönler:', this.margin, this.currentY);
      this.currentY += 6;
      
      this.doc.setFont('helvetica', 'normal');
      reportData.strengths.forEach(strength => {
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
    if (reportData.areasForImprovement.length > 0) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Geliştirilmesi Gereken Alanlar:', this.margin, this.currentY);
      this.currentY += 6;
      
      this.doc.setFont('helvetica', 'normal');
      reportData.areasForImprovement.forEach(area => {
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
    if (reportData.recommendations.length > 0) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Öneriler:', this.margin, this.currentY);
      this.currentY += 6;
      
      this.doc.setFont('helvetica', 'normal');
      reportData.recommendations.forEach(recommendation => {
        if (this.currentY > this.pageHeight - 20) {
          this.doc.addPage();
          this.currentY = 20;
        }
        this.doc.text(`• ${recommendation}`, this.margin + 5, this.currentY);
        this.currentY += 5;
      });
    }
  }

  private addFooter() {
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

  private addTable(data: string[][], columnWidths: number[]) {
    const startX = this.margin;
    const startY = this.currentY;

    data.forEach((row, rowIndex) => {
      let currentX = startX;
      
      row.forEach((cell, colIndex) => {
        this.doc.text(cell, currentX, startY + (rowIndex + 1) * 6);
        currentX += columnWidths[colIndex] || 40;
      });
    });

    this.currentY = startY + (data.length + 1) * 6;
  }
}

export default AdvancedPdfGenerator;
