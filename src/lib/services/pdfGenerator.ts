import puppeteer, { Browser } from 'puppeteer';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface ReportData {
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
}

export class PDFGenerator {
  private static instance: PDFGenerator;
  private browser: Browser | null = null;

  private constructor() {}

  public static getInstance(): PDFGenerator {
    if (!PDFGenerator.instance) {
      PDFGenerator.instance = new PDFGenerator();
    }
    return PDFGenerator.instance;
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  public async generateAdvancedPDF(data: ReportData): Promise<Buffer> {
    try {
      // Check if Puppeteer is available
      if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_PUPPETEER) {
        throw new Error('Puppeteer disabled in production');
      }

      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });
      
      // Generate HTML content
      const htmlContent = this.generateHTMLReport(data);
      
      // Set content and wait for fonts to load
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(),
        footerTemplate: this.getFooterTemplate(),
        timeout: 30000
      });
      
      await page.close();
      return Buffer.from(pdfBuffer);
      
    } catch (error) {
      console.error('Advanced PDF generation failed:', error);
      // Fallback to simple PDF
      return this.generateSimplePDF(data);
    }
  }

  private generateHTMLReport(data: ReportData): string {
    const currentDate = new Date().toLocaleDateString('tr-TR');
    
    return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.student.firstName} ${data.student.lastName} - Performans Raporu</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background: #fff;
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                margin-bottom: 30px;
            }
            
            .header h1 {
                font-size: 28px;
                margin-bottom: 10px;
                font-weight: 700;
            }
            
            .header p {
                font-size: 16px;
                opacity: 0.9;
            }
            
            .student-info {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 4px solid #667eea;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .info-item {
                display: flex;
                align-items: center;
            }
            
            .info-label {
                font-weight: 600;
                color: #555;
                margin-right: 10px;
                min-width: 120px;
            }
            
            .performance-overview {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .performance-card {
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .performance-card h3 {
                color: #667eea;
                margin-bottom: 10px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .performance-value {
                font-size: 32px;
                font-weight: 700;
                color: #333;
                margin-bottom: 5px;
            }
            
            .performance-label {
                color: #666;
                font-size: 12px;
            }
            
            .section {
                margin-bottom: 30px;
            }
            
            .section-title {
                font-size: 20px;
                color: #333;
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 2px solid #667eea;
            }
            
            .subject-stats {
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .subject-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-bottom: 1px solid #f1f3f4;
            }
            
            .subject-item:last-child {
                border-bottom: none;
            }
            
            .subject-name {
                font-weight: 600;
                color: #333;
            }
            
            .progress-bar {
                width: 200px;
                height: 8px;
                background: #e9ecef;
                border-radius: 4px;
                overflow: hidden;
                margin: 0 15px;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                transition: width 0.3s ease;
            }
            
            .progress-value {
                font-weight: 600;
                color: #667eea;
                min-width: 40px;
                text-align: right;
            }
            
            .goals-section {
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 20px;
            }
            
            .goal-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid #f1f3f4;
            }
            
            .goal-item:last-child {
                border-bottom: none;
            }
            
            .goal-title {
                font-weight: 600;
                color: #333;
            }
            
            .goal-status {
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .status-completed {
                background: #d4edda;
                color: #155724;
            }
            
            .status-in-progress {
                background: #fff3cd;
                color: #856404;
            }
            
            .status-pending {
                background: #f8d7da;
                color: #721c24;
            }
            
            .recommendations {
                background: #e3f2fd;
                border: 1px solid #bbdefb;
                border-radius: 8px;
                padding: 20px;
            }
            
            .recommendation-item {
                margin-bottom: 10px;
                padding-left: 20px;
                position: relative;
            }
            
            .recommendation-item:before {
                content: "•";
                color: #1976d2;
                font-weight: bold;
                position: absolute;
                left: 0;
            }
            
            .recommendation-item:last-child {
                margin-bottom: 0;
            }
            
            .page-break {
                page-break-before: always;
            }
            
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                text-align: center;
                color: #666;
                font-size: 12px;
            }
            
            @media print {
                .page-break {
                    page-break-before: always;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${data.student.firstName} ${data.student.lastName}</h1>
            <p>Performans Raporu - ${currentDate}</p>
        </div>
        
        <div class="student-info">
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Öğrenci:</span>
                    <span>${data.student.firstName} ${data.student.lastName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Öğretmen:</span>
                    <span>${data.teacher.firstName} ${data.teacher.lastName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Tarih:</span>
                    <span>${currentDate}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">E-posta:</span>
                    <span>${data.student.email || 'Belirtilmemiş'}</span>
                </div>
            </div>
        </div>
        
        <div class="performance-overview">
            <div class="performance-card">
                <h3>Ödev Tamamlama</h3>
                <div class="performance-value">%${data.performance.assignmentCompletion}</div>
                <div class="performance-label">${data.performance.submittedAssignments}/${data.performance.totalAssignments} ödev</div>
            </div>
            <div class="performance-card">
                <h3>Hedef İlerlemesi</h3>
                <div class="performance-value">%${data.performance.goalsProgress}</div>
                <div class="performance-label">Hedeflerde ilerleme</div>
            </div>
            <div class="performance-card">
                <h3>Genel Performans</h3>
                <div class="performance-value">%${data.performance.overallPerformance}</div>
                <div class="performance-label">Toplam performans</div>
            </div>
            <div class="performance-card">
                <h3>Ortalama Not</h3>
                <div class="performance-value">${data.performance.averageGrade}</div>
                <div class="performance-label">100 üzerinden</div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Branş Bazlı Performans</h2>
            <div class="subject-stats">
                ${Object.entries(data.subjectStats).map(([subject, stats]) => `
                    <div class="subject-item">
                        <div class="subject-name">${subject}</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${stats.completion}%"></div>
                        </div>
                        <div class="progress-value">%${stats.completion}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="page-break"></div>
        
        <div class="section">
            <h2 class="section-title">Hedefler ve İlerleme</h2>
            <div class="goals-section">
                ${data.goals.map(goal => `
                    <div class="goal-item">
                        <div>
                            <div class="goal-title">${goal.title}</div>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">${goal.description}</div>
                        </div>
                        <div>
                            <div class="goal-status status-${goal.status}">${goal.status === 'completed' ? 'Tamamlandı' : goal.status === 'in_progress' ? 'Devam Ediyor' : 'Beklemede'}</div>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">%${goal.progress}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Son Ödevler</h2>
            <div class="goals-section">
                ${data.assignments.slice(0, 10).map(assignment => `
                    <div class="goal-item">
                        <div>
                            <div class="goal-title">${assignment.title}</div>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">${assignment.subject} - ${assignment.dueDate}</div>
                        </div>
                        <div>
                            <div class="goal-status status-${assignment.status}">
                                ${assignment.status === 'submitted' ? 'Teslim Edildi' : 
                                  assignment.status === 'graded' ? 'Değerlendirildi' : 
                                  assignment.status === 'late' ? 'Gecikti' : 'Beklemede'}
                            </div>
                            ${assignment.grade ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">Not: ${assignment.grade}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Değerlendirme ve Öneriler</h2>
            <div class="recommendations">
                ${data.recommendations.map(rec => `
                    <div class="recommendation-item">${rec}</div>
                `).join('')}
            </div>
        </div>
        
        <div class="footer">
            <p>Bu rapor Hedefly Eğitim Sistemi tarafından otomatik olarak oluşturulmuştur.</p>
            <p>Rapor Tarihi: ${currentDate} | Öğretmen: ${data.teacher.firstName} ${data.teacher.lastName}</p>
        </div>
    </body>
    </html>
    `;
  }

  private getHeaderTemplate(): string {
    return `
      <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin-top: 10px;">
        Hedefly Eğitim Sistemi - Performans Raporu
      </div>
    `;
  }

  private getFooterTemplate(): string {
    return `
      <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin-bottom: 10px;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `;
  }

  private generateSimplePDF(data: ReportData): Buffer {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text(`${data.student.firstName} ${data.student.lastName} - Performans Raporu`, 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, 35);
      doc.text(`Öğretmen: ${data.teacher.firstName} ${data.teacher.lastName}`, 20, 45);
      
      // Performance overview
      let y = 65;
      doc.setFontSize(16);
      doc.text('Genel Performans', 20, y);
      y += 15;
      
      doc.setFontSize(12);
      doc.text(`Ödev Tamamlama: %${data.performance.assignmentCompletion}`, 20, y);
      y += 10;
      doc.text(`Hedef İlerlemesi: %${data.performance.goalsProgress}`, 20, y);
      y += 10;
      doc.text(`Genel Performans: %${data.performance.overallPerformance}`, 20, y);
      y += 10;
      doc.text(`Ortalama Not: ${data.performance.averageGrade}/100`, 20, y);
      y += 20;
      
      // Subject stats
      doc.setFontSize(16);
      doc.text('Branş Bazlı Performans', 20, y);
      y += 15;
      
      doc.setFontSize(12);
      Object.entries(data.subjectStats).forEach(([subject, stats]) => {
        doc.text(`${subject}: %${stats.completion}`, 20, y);
        y += 10;
      });
      
      y += 10;
      
      // Recommendations
      doc.setFontSize(16);
      doc.text('Öneriler', 20, y);
      y += 15;
      
      doc.setFontSize(12);
      data.recommendations.forEach(rec => {
        doc.text(`• ${rec}`, 20, y);
        y += 10;
      });
      
      return Buffer.from(doc.output('arraybuffer'));
    } catch (error) {
      console.error('Simple PDF generation failed:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default PDFGenerator;
