import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import PDFGenerator, { ReportData } from '@/lib/services/pdfGenerator';
import ReportDataCollector, { StudentAnalysisData } from '@/lib/services/reportDataCollector';
import RobustReportDataCollector from '@/lib/services/robustReportDataCollector';
import AdvancedPdfGenerator from '@/lib/services/advancedPdfGenerator';
import { jsPDF } from 'jspdf';
import { safeIdToString } from '@/lib/utils/idHelper';

export const dynamic = 'force-dynamic';

// Enhanced error logging
function logError(context: string, error: any, additionalData?: any) {
  console.error(`[REPORT_ERROR] ${context}:`, {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    ...additionalData
  });
}

// Alternative PDF generation using simple HTML-to-PDF approach
async function generateSimplePDF(student: any, analysisData: any): Promise<Buffer> {
  try {
    console.log('Generating simple PDF for student:', student?.firstName);
    
    const doc = new jsPDF();
    
    // Basic document setup
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text(`${student?.firstName || 'Bilinmeyen'} ${student?.lastName || 'Öğrenci'} - Performans Raporu`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, 40);
    
    // Simple content
    let y = 60;
    const addText = (text: string, fontSize = 12) => {
      doc.setFontSize(fontSize);
      doc.text(text, 20, y);
      y += fontSize + 5;
    };
    
    addText('Genel Performans', 14);
    addText(`Ödev Tamamlama: %${analysisData?.assignmentCompletion || 0}`);
    addText(`Hedef İlerlemesi: %${analysisData?.goalsProgress || 0}`);
    addText(`Genel Performans: %${analysisData?.overallPerformance || 0}`);
    addText(`Ortalama Not: ${analysisData?.averageGrade || 0}/100`);
    
    // Subject details
    if (analysisData?.subjectDetails && Object.keys(analysisData.subjectDetails).length > 0) {
      addText('Branş Detayları', 14);
      Object.entries(analysisData.subjectDetails).forEach(([subject, details]: [string, any]) => {
        addText(`${subject}: %${details?.completion || 0}`, 10);
      });
    } else if (analysisData?.subjectStats && Object.keys(analysisData.subjectStats).length > 0) {
      addText('Branş Detayları', 14);
      Object.entries(analysisData.subjectStats).forEach(([subject, value]: [string, any]) => {
        addText(`${subject}: %${value || 0}`, 10);
      });
    }
    
    // Recommendations
    addText('Öneriler', 14);
    const overallPerf = analysisData?.overallPerformance || 0;
    let recommendation = 'Öğrencinin performansını artırmak için ek destek önerilir.';
    if (overallPerf > 80) {
      recommendation = 'Öğrenci mükemmel performans gösteriyor. Bu başarıyı sürdürmesi için teşvik edilmelidir.';
    } else if (overallPerf > 60) {
      recommendation = 'Öğrenci iyi performans gösteriyor. Daha da gelişmesi için hedefler belirlenebilir.';
    } else if (overallPerf > 40) {
      recommendation = 'Öğrencinin performansını artırmak için düzenli çalışma planı oluşturulmalıdır.';
    }
    addText(recommendation, 10);
    
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  } catch (error) {
    console.error('Error generating simple PDF:', error);
    throw new Error(`Basit PDF oluşturma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let studentId: string | null = null;
  let teacherId: string | null = null;

  try {
    console.log('Report API: Starting request processing with robust system');

    // Step 1: Authentication
    const authResult = await getCurrentUser(request);
    if (!authResult) {
      logError('Authentication failed', 'No auth result');
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    if (authResult.role !== 'teacher') {
      logError('Authorization failed', `Invalid role: ${authResult.role}`);
      return NextResponse.json(
        { error: 'Sadece öğretmenler rapor oluşturabilir' },
        { status: 403 }
      );
    }

    if (!authResult._id) {
      logError('Missing user ID', 'authResult._id is missing');
      return NextResponse.json(
        { error: 'Kullanıcı verisi eksik' },
        { status: 500 }
      );
    }

    teacherId = safeIdToString(authResult._id);
    console.log('Report API: Authentication successful', { teacherId });

    // Step 2: Extract student ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    studentId = pathParts[pathParts.indexOf('students') + 1];

    if (!studentId) {
      logError('Student ID extraction failed', 'No student ID in URL');
      return NextResponse.json(
        { error: 'Öğrenci ID bulunamadı' },
        { status: 400 }
      );
    }

    console.log('Report API: Student ID extracted', { studentId });

    // Step 3: Validate student ID format
    if (studentId.length !== 24) {
      logError('Invalid student ID format', { studentId, length: studentId.length });
      return NextResponse.json(
        { error: 'Geçersiz öğrenci ID formatı (MongoDB ObjectId bekleniyor)' },
        { status: 400 }
      );
    }

    // Detect action type: create report entry vs generate PDF
    const urlObj = new URL(request.url);
    const format = urlObj.searchParams.get('format');

    // If not asking for PDF, create a simple report entry
    if (!format) {
      await connectDB();
      const reportId = `${studentId}-${Date.now()}`;
      return NextResponse.json({
        success: true,
        _id: reportId,
        title: 'Otomatik Rapor',
        createdAt: new Date().toISOString(),
        isPublic: false
      }, { status: 201 });
    }

    // Step 4: Parse request body for date range (for PDF generation)
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    try {
      const body = await request.json().catch(() => ({}));
      if (body.startDate) {
        startDate = new Date(body.startDate);
        if (isNaN(startDate.getTime())) {
          throw new Error('Geçersiz başlangıç tarihi');
        }
      }
      if (body.endDate) {
        endDate = new Date(body.endDate);
        if (isNaN(endDate.getTime())) {
          throw new Error('Geçersiz bitiş tarihi');
        }
      }
    } catch (parseError) {
      logError('Request body parsing failed', parseError);
      return NextResponse.json(
        { error: 'Geçersiz istek verisi' },
        { status: 400 }
      );
    }

    console.log('Report API: Request body parsed', { startDate, endDate });

    // Step 5: Database connection
    try {
      await connectDB();
      console.log('Report API: Database connected successfully');
    } catch (dbError) {
      logError('Database connection failed', dbError);
      return NextResponse.json(
        { error: 'Veritabanı bağlantı hatası' },
        { status: 500 }
      );
    }

    // Step 6: Prepare analysis data
    const analysisData = {
      studentId,
      teacherId: teacherId!,
      startDate,
      endDate
    };

    console.log('Report API: Analysis data prepared', analysisData);

    // Step 7: Try robust data collection first, fallback to original if needed
    let reportData;
    let useRobustSystem = true;
    
    try {
      console.log('Report API: Starting robust data collection');
      const robustData = await RobustReportDataCollector.collectStudentData(analysisData);
      
      // Use robust data directly
      reportData = robustData;
      
      console.log('Report API: Robust data collection completed successfully');
    } catch (robustError) {
      logError('Robust data collection failed, trying fallback', robustError);
      useRobustSystem = false;
      
        try {
          console.log('Report API: Starting fallback data collection');
          reportData = await ReportDataCollector.collectStudentData(analysisData as StudentAnalysisData);
          console.log('Report API: Fallback data collection completed successfully');
        } catch (fallbackError) {
        logError('Both robust and fallback data collection failed', fallbackError, { studentId, teacherId });
        return NextResponse.json(
          { 
            error: 'Öğrenci verileri toplanamadı', 
            details: fallbackError instanceof Error ? fallbackError.message : 'Bilinmeyen hata',
            debug: {
              studentId,
              teacherId,
              robustError: robustError instanceof Error ? robustError.message : 'Unknown',
              fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Unknown',
              timestamp: new Date().toISOString()
            }
          },
          { status: 500 }
        );
      }
    }

    // Step 8: Generate PDF with appropriate generator
    let pdfBuffer: Buffer;
    try {
      console.log('Report API: Starting PDF generation', { useRobustSystem });
      
      if (useRobustSystem) {
        const pdfGenerator = new AdvancedPdfGenerator();
        pdfBuffer = await pdfGenerator.generateReport(reportData);
      } else {
        // Try simple PDF as fallback
        try {
          pdfBuffer = await generateSimplePDF(reportData.student, reportData.performance);
        } catch (advancedPdfError) {
          console.warn('Simple PDF generation failed unexpectedly', advancedPdfError);
          pdfBuffer = await generateSimplePDF(reportData.student, reportData.performance);
        }
      }
      
      console.log('Report API: PDF generation completed successfully');
    } catch (pdfError) {
      logError('PDF generation failed', pdfError, { studentId, teacherId, useRobustSystem });
      return NextResponse.json(
        { 
          error: 'PDF oluşturulamadı', 
          details: pdfError instanceof Error ? pdfError.message : 'Bilinmeyen hata' 
        },
        { status: 500 }
      );
    }

    // Step 9: Generate safe filename
    const safeFirstName = reportData.student.firstName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '');
    const safeLastName = reportData.student.lastName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '');
    const filename = `rapor_${safeFirstName}_${safeLastName}_${new Date().toISOString().split('T')[0]}.pdf`;

    console.log('Report API: Report generation completed successfully', {
      studentId,
      teacherId,
      filename,
      processingTime: Date.now() - startTime,
      pdfSize: pdfBuffer.length,
      systemUsed: useRobustSystem ? 'robust' : 'fallback'
    });

    // Step 10: Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Report-Generated-At': new Date().toISOString(),
        'X-Student-ID': studentId,
        'X-Teacher-ID': teacherId || 'unknown',
        'X-System-Used': useRobustSystem ? 'robust' : 'fallback'
      }
    });

  } catch (error) {
    logError('Unexpected error in report API', error, {
      studentId,
      teacherId,
      processingTime: Date.now() - startTime
    });

    return NextResponse.json(
      { 
        error: 'Rapor oluşturulurken beklenmeyen bir hata oluştu',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata',
        debug: {
          studentId,
          teacherId,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

// GET: return report list (UI expects an array)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // For now return empty list; UI handles empty state
    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}