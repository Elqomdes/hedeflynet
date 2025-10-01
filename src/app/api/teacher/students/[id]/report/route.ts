import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Report } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import PDFGenerator, { ReportData } from '@/lib/services/pdfGenerator';
import ReportDataCollector, { StudentAnalysisData } from '@/lib/services/reportDataCollector';
import { jsPDF } from 'jspdf';

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
      recommendation = 'Öğrenci mükemmel performans sergiliyor. Bu başarıyı sürdürmesi için teşvik edilmelidir.';
    } else if (overallPerf > 60) {
      recommendation = 'Öğrenci iyi performans sergiliyor. Daha da gelişmesi için ek çalışmalar önerilir.';
    }
    addText(recommendation);
    
    const pdfOutput = doc.output('arraybuffer');
    const buffer = Buffer.from(pdfOutput);
    
    console.log('Simple PDF generated successfully, size:', buffer.length);
    return buffer;
  } catch (error) {
    logError('Simple PDF generation failed', error);
    throw new Error(`PDF oluşturma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    // Authentication
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request data
    let requestData: any = {};
    try {
      requestData = await request.json();
    } catch (parseError) {
      logError('Request parsing failed', parseError);
      // Continue with empty data if parsing fails
    }
    
    // Database connection
    try {
      await connectDB();
    } catch (dbError) {
      logError('Database connection failed', dbError);
      return NextResponse.json(
        { error: 'Veritabanı bağlantı hatası' },
        { status: 500 }
      );
    }

    const studentId = params.id;
    const teacherId = authResult._id;

    // Collect comprehensive student data
    let reportData: ReportData;
    try {
      // Validate student ID format
      if (!studentId || typeof studentId !== 'string' || studentId.length < 10) {
        throw new Error('Geçersiz öğrenci ID formatı');
      }

      const analysisData: StudentAnalysisData = {
        studentId,
        teacherId: (teacherId as string),
        startDate: requestData.startDate ? new Date(requestData.startDate) : undefined,
        endDate: requestData.endDate ? new Date(requestData.endDate) : undefined
      };
      
      console.log('Report API: Starting data collection', {
        studentId,
        teacherId,
        startDate: analysisData.startDate,
        endDate: analysisData.endDate
      });
      
      reportData = await ReportDataCollector.collectStudentData(analysisData);
      
      console.log('Report API: Data collection successful', {
        student: reportData.student.firstName,
        assignments: reportData.assignments.length,
        goals: reportData.goals.length
      });
    } catch (dataError) {
      logError('Data collection failed', dataError, { studentId, teacherId });
      
      // Provide more specific error messages
      let errorMessage = 'Öğrenci verileri toplanamadı';
      if (dataError instanceof Error) {
        if (dataError.message.includes('bulunamadı')) {
          errorMessage = 'Öğrenci veya öğretmen bulunamadı';
        } else if (dataError.message.includes('bağlantı')) {
          errorMessage = 'Veritabanı bağlantı hatası';
        } else if (dataError.message.includes('Geçersiz')) {
          errorMessage = dataError.message;
        }
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? 
            (dataError instanceof Error ? dataError.message : 'Bilinmeyen hata') : undefined
        },
        { status: 500 }
      );
    }

    // Create report record
    let report;
    try {
      report = new Report({
        studentId,
        teacherId,
        title: `${reportData.student.firstName} ${reportData.student.lastName} - Performans Raporu`,
        content: JSON.stringify(reportData),
        isPublic: false
      });
      await report.save();
    } catch (reportError) {
      logError('Report creation failed', reportError, { studentId });
      // Continue without report record
    }

    // Determine response format
    const format = request.nextUrl.searchParams.get('format') || 'pdf';

    if (format === 'pdf') {
      try {
        // Try advanced PDF first (Puppeteer)
        let pdfBuffer: Buffer;
        try {
          const pdfGenerator = PDFGenerator.getInstance();
          pdfBuffer = await pdfGenerator.generateAdvancedPDF(reportData);
        } catch (puppeteerError) {
          console.warn('Puppeteer PDF generation failed, falling back to jsPDF:', puppeteerError);
          // Fallback to simple PDF generation
          pdfBuffer = await generateSimplePDF(reportData.student, reportData.performance);
        }
        
        if (!pdfBuffer || pdfBuffer.length === 0) {
          throw new Error('PDF buffer is empty');
        }

        // Create safe filename
        const safeFirstName = reportData.student.firstName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '');
        const safeLastName = reportData.student.lastName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '');
        const filename = `${safeFirstName}_${safeLastName}_raporu_${new Date().toISOString().split('T')[0]}.pdf`;

        const processingTime = Date.now() - startTime;
        logError('PDF generation successful', null, { 
          bufferSize: pdfBuffer.length,
          processingTime,
          studentId 
        });

        return new NextResponse(new Uint8Array(pdfBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': pdfBuffer.length.toString(),
            'Cache-Control': 'no-cache'
          }
        });
      } catch (pdfError) {
        logError('PDF generation failed', pdfError, { studentId });
        
        // Fallback to JSON response if PDF fails
        return NextResponse.json({
          _id: report?._id,
          title: report?.title,
          createdAt: report?.createdAt,
          isPublic: report?.isPublic,
          url: `/rapor/${report?._id}`,
          error: 'PDF oluşturulamadı, JSON yanıtı döndürülüyor',
          pdfError: process.env.NODE_ENV === 'development' ? 
            (pdfError instanceof Error ? pdfError.message : 'Unknown PDF error') : undefined
        });
      }
    }

    // JSON response
    return NextResponse.json({
      _id: report?._id,
      title: report?.title,
      createdAt: report?.createdAt,
      isPublic: report?.isPublic,
      url: `/rapor/${report?._id}`,
      data: reportData
    });

  } catch (error) {
    logError('Unexpected error in report generation', error, { studentId: params.id });
    return NextResponse.json(
      { 
        error: 'Rapor oluşturulurken beklenmeyen bir hata oluştu',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}