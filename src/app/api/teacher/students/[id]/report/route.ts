import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Report } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
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

// Robust data validation and sanitization
function validateAndSanitizeData(analysisData: any) {
  const defaults = {
    assignmentCompletion: 0,
    totalAssignments: 0,
    submittedAssignments: 0,
    gradedAssignments: 0,
    gradingRate: 0,
    averageGrade: 0,
    subjectStats: {},
    subjectDetails: {},
    goalsProgress: 0,
    overallPerformance: 0,
    monthlyProgress: [],
    assignmentTitleCounts: []
  };

  const sanitized = { ...defaults };
  
  // Safely extract and validate numeric values
  Object.keys(defaults).forEach(key => {
    if (key === 'subjectStats' || key === 'subjectDetails') {
      sanitized[key] = analysisData[key] && typeof analysisData[key] === 'object' 
        ? analysisData[key] 
        : defaults[key];
    } else if (key === 'monthlyProgress' || key === 'assignmentTitleCounts') {
      sanitized[key] = Array.isArray(analysisData[key]) 
        ? analysisData[key] 
        : defaults[key];
    } else {
      const value = analysisData[key];
      if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
        sanitized[key] = Math.max(0, Math.min(100, value));
      }
    }
  });

  return sanitized;
}

// Alternative PDF generation using simple HTML-to-PDF approach
async function generateSimplePDF(student: any, analysisData: any): Promise<Buffer> {
  try {
    const doc = new jsPDF();
    
    // Basic document setup
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text(`${student.firstName} ${student.lastName} - Performans Raporu`, 20, 20);
    
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
    addText(`Ödev Tamamlama: %${analysisData.assignmentCompletion}`);
    addText(`Hedef İlerlemesi: %${analysisData.goalsProgress}`);
    addText(`Genel Performans: %${analysisData.overallPerformance}`);
    addText(`Ortalama Not: ${analysisData.averageGrade}/100`);
    
    // Subject details
    if (analysisData.subjectDetails && Object.keys(analysisData.subjectDetails).length > 0) {
      addText('Branş Detayları', 14);
      Object.entries(analysisData.subjectDetails).forEach(([subject, details]: [string, any]) => {
        addText(`${subject}: %${details?.completion || 0}`, 10);
      });
    }
    
    // Recommendations
    addText('Öneriler', 14);
    const overallPerf = analysisData.overallPerformance || 0;
    let recommendation = 'Öğrencinin performansını artırmak için ek destek önerilir.';
    if (overallPerf > 80) {
      recommendation = 'Öğrenci mükemmel performans sergiliyor. Bu başarıyı sürdürmesi için teşvik edilmelidir.';
    } else if (overallPerf > 60) {
      recommendation = 'Öğrenci iyi performans sergiliyor. Daha da gelişmesi için ek çalışmalar önerilir.';
    }
    addText(recommendation);
    
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  } catch (error) {
    logError('Simple PDF generation failed', error);
    throw error;
  }
}

// Enhanced PDF generation with better error handling
async function generateEnhancedPDF(student: any, analysisData: any): Promise<Buffer> {
  try {
    // Validate jsPDF availability
    if (!jsPDF) {
      throw new Error('jsPDF library not available');
    }
    
    // Validate student data
    if (!student?.firstName || !student?.lastName) {
      throw new Error('Invalid student data');
    }
    
    // Create document with error handling
    let doc;
    try {
      doc = new jsPDF({ unit: 'pt', format: 'a4' });
    } catch (error) {
      logError('jsPDF initialization failed', error);
      throw new Error('PDF document creation failed');
    }
    
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 40;
    let yPos = margin + 20;
    
    // Safe text addition function
    const addText = (text: string, x: number, y: number, fontSize = 12, color = [40, 40, 40]) => {
      try {
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(text, x, y);
        return y + fontSize + 5;
      } catch (error) {
        logError('Text addition failed', error, { text, x, y, fontSize });
        return y + 15; // Fallback spacing
      }
    };
    
    // Safe page break function
    const checkPageBreak = (requiredSpace = 20) => {
      if (yPos > pageHeight - margin - requiredSpace) {
        try {
          doc.addPage();
          yPos = margin;
        } catch (error) {
          logError('Page break failed', error);
        }
      }
    };
    
    // Header section
    try {
      yPos = addText(`${student.firstName} ${student.lastName} - Performans Raporu`, margin, yPos, 22);
      yPos = addText(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, margin, yPos, 11, [100, 100, 100]);
      
      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 24;
    } catch (error) {
      logError('Header section failed', error);
    }
    
    // General Performance Section
    try {
      checkPageBreak(100);
      yPos = addText('Genel Performans', margin, yPos, 16);
      
      const generalRows = [
        `Ödev Tamamlama Oranı: %${analysisData.assignmentCompletion || 0}`,
        `Hedef İlerlemesi: %${analysisData.goalsProgress || 0}`,
        `Genel Performans: %${analysisData.overallPerformance || 0}`,
        `Teslim Edilen Ödevler: ${analysisData.submittedAssignments || 0}`,
        `Değerlendirilen Ödevler: ${analysisData.gradedAssignments || 0}`,
        `Ortalama Not: ${analysisData.averageGrade || 0}/100`
      ];
      
      for (const row of generalRows) {
        checkPageBreak(20);
        yPos = addText(row, margin, yPos, 12);
      }
      yPos += 8;
    } catch (error) {
      logError('General performance section failed', error);
    }
    
    // Subject Performance Section
    try {
      if (analysisData.subjectDetails && Object.keys(analysisData.subjectDetails).length > 0) {
        checkPageBreak(120);
        yPos = addText('Branş Bazlı Performans', margin, yPos, 16);
        
        Object.entries(analysisData.subjectDetails).forEach(([subject, details]: [string, any]) => {
          checkPageBreak(80);
          yPos = addText(subject, margin, yPos, 14);
          
          const subjectRows = [
            `• Toplam Ödev: ${details?.totalAssignments || 0}`,
            `• Teslim Edilen: ${details?.submittedAssignments || 0}`,
            `• Değerlendirilen: ${details?.gradedAssignments || 0}`,
            `• Tamamlama Oranı: %${details?.completion || 0}`,
            `• Ortalama Not: ${details?.averageGrade || 0}/100`
          ];
          
          for (const sRow of subjectRows) {
            checkPageBreak(20);
            yPos = addText(sRow, margin + 10, yPos, 10, [80, 80, 80]);
          }
          yPos += 10;
        });
      }
    } catch (error) {
      logError('Subject performance section failed', error);
    }
    
    // Monthly Progress Section
    try {
      if (analysisData.monthlyProgress && analysisData.monthlyProgress.length > 0) {
        checkPageBreak(140);
        yPos = addText('Aylık İlerleme', margin, yPos, 16);
        
        (analysisData.monthlyProgress || []).forEach((month: any) => {
          checkPageBreak(20);
          yPos = addText(
            `${month?.month || 'Bilinmeyen'}: ${month?.assignments || 0} ödev, ${month?.goalsCompleted || 0} hedef`,
            margin, yPos, 10, [80, 80, 80]
          );
        });
        yPos += 12;
      }
    } catch (error) {
      logError('Monthly progress section failed', error);
    }
    
    // Recommendations Section
    try {
      checkPageBreak(100);
      yPos = addText('Öneriler', margin, yPos, 16);
      
      const overallPerf = analysisData.overallPerformance || 0;
      let recommendation = 'Öğrencinin performansını artırmak için ek destek ve çalışma planı oluşturulmalıdır.';
      if (overallPerf > 80) {
        recommendation = 'Öğrenci mükemmel bir performans sergiliyor. Bu başarıyı sürdürmesi için teşvik edilmelidir.';
      } else if (overallPerf > 60) {
        recommendation = 'Öğrenci iyi bir performans sergiliyor. Daha da gelişmesi için ek çalışmalar önerilir.';
      }
      
      // Safe text wrapping
      try {
        const splitText = doc.splitTextToSize(recommendation, pageWidth - margin * 2);
        doc.text(splitText, margin, yPos);
      } catch (textError) {
        logError('Text wrapping failed', textError);
        doc.text(recommendation, margin, yPos);
      }
    } catch (error) {
      logError('Recommendations section failed', error);
    }
    
    // Footer
    try {
      const pageCount = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('Hedefly Eğitim Sistemi', margin, pageHeight - margin / 2);
        doc.text(`Sayfa ${i} / ${pageCount}`, pageWidth - margin - 80, pageHeight - margin / 2);
      }
    } catch (error) {
      logError('Footer addition failed', error);
    }
    
    // Generate PDF buffer with validation
    try {
      const pdfOutput = doc.output('arraybuffer');
      if (!pdfOutput || pdfOutput.byteLength === 0) {
        throw new Error('Empty PDF output generated');
      }
      
      const buffer = Buffer.from(pdfOutput);
      if (buffer.length === 0) {
        throw new Error('Empty buffer created from PDF output');
      }
      
      return buffer;
    } catch (error) {
      logError('PDF buffer generation failed', error);
      throw error;
    }
    
  } catch (error) {
    logError('Enhanced PDF generation failed', error);
    throw error;
  }
}

// Main PDF generation with fallback
async function generatePDFContent(student: any, analysisData: any): Promise<Buffer> {
  const methods = [
    { name: 'Enhanced PDF', fn: generateEnhancedPDF },
    { name: 'Simple PDF', fn: generateSimplePDF }
  ];
  
  for (const method of methods) {
    try {
      logError(`Attempting ${method.name} generation`, null, { studentId: student._id });
      const result = await method.fn(student, analysisData);
      
      if (result && result.length > 0) {
        logError(`${method.name} generation successful`, null, { 
          bufferSize: result.length,
          studentId: student._id 
        });
        return result;
      } else {
        throw new Error(`${method.name} returned empty result`);
      }
    } catch (error) {
      logError(`${method.name} generation failed`, error, { studentId: student._id });
      
      // If this is the last method, throw the error
      if (method === methods[methods.length - 1]) {
        throw new Error(`All PDF generation methods failed. Last error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Otherwise, continue to next method
      console.warn(`Falling back to next PDF generation method after ${method.name} failed`);
    }
  }
  
  throw new Error('No PDF generation methods available');
}

function generateReportContent(student: any, analysisData: any): string {
  const overallPerf = analysisData.overallPerformance || 0;
  const subjectStats = analysisData.subjectStats || {};
  
  return `
# ${student?.firstName || 'Bilinmeyen'} ${student?.lastName || 'Öğrenci'} - Performans Raporu

## Genel Değerlendirme
- **Ödev Tamamlama Oranı**: %${analysisData.assignmentCompletion || 0}
- **Hedef İlerlemesi**: %${analysisData.goalsProgress || 0}
- **Genel Performans**: %${overallPerf}

## Branş Bazlı Performans
${Object.entries(subjectStats).map(([subject, value]) => 
  `- **${subject}**: %${value || 0}`
).join('\n')}

## Öneriler
${overallPerf > 80 ? 
  'Öğrenci mükemmel bir performans sergiliyor. Bu başarıyı sürdürmesi için teşvik edilmelidir.' :
  overallPerf > 60 ?
  'Öğrenci iyi bir performans sergiliyor. Daha da gelişmesi için ek çalışmalar önerilir.' :
  'Öğrencinin performansını artırmak için ek destek ve çalışma planı oluşturulmalıdır.'
}

## Tarih
${new Date().toLocaleDateString('tr-TR')}
  `;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let analysisData: any = null;
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

    // Parse and validate request data
    try {
      analysisData = await request.json();
    } catch (parseError) {
      logError('Request parsing failed', parseError);
      return NextResponse.json(
        { error: 'Geçersiz istek verisi' },
        { status: 400 }
      );
    }
    
    // Validate and sanitize analysis data
    const validatedData = validateAndSanitizeData(analysisData);
    
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

    // Get student info with error handling
    let student;
    try {
      student = await User.findById(studentId).select('firstName lastName');
      if (!student) {
        return NextResponse.json(
          { error: 'Öğrenci bulunamadı' },
          { status: 404 }
        );
      }
    } catch (studentError) {
      logError('Student lookup failed', studentError, { studentId });
      return NextResponse.json(
        { error: 'Öğrenci bilgileri alınamadı' },
        { status: 500 }
      );
    }

    // Validate student data
    if (!student.firstName || !student.lastName) {
      return NextResponse.json(
        { error: 'Öğrenci bilgileri eksik' },
        { status: 400 }
      );
    }

    // Create report record
    let report;
    try {
      report = new Report({
        studentId,
        teacherId,
        title: `${student.firstName} ${student.lastName} - Performans Raporu`,
        content: generateReportContent(student, validatedData),
        data: {
          assignmentCompletion: validatedData.assignmentCompletion,
          subjectStats: validatedData.subjectStats,
          goalsProgress: validatedData.goalsProgress,
          overallPerformance: validatedData.overallPerformance
        },
        isPublic: true
      });

      await report.save();
    } catch (reportError) {
      logError('Report creation failed', reportError, { studentId, teacherId });
      return NextResponse.json(
        { error: 'Rapor kaydı oluşturulamadı' },
        { status: 500 }
      );
    }

    // Determine response format
    const format = request.nextUrl.searchParams.get('format') || 'pdf';

    if (format === 'pdf') {
      try {
        // Generate PDF with fallback mechanisms
        const pdfBuffer = await generatePDFContent(student, validatedData);
        
        if (!pdfBuffer || pdfBuffer.length === 0) {
          throw new Error('PDF buffer is empty');
        }

        // Create safe filename
        const safeFirstName = student.firstName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '');
        const safeLastName = student.lastName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '');
        const filename = `${safeFirstName}_${safeLastName}_raporu.pdf`;

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
          _id: report._id,
          title: report.title,
          createdAt: report.createdAt,
          isPublic: report.isPublic,
          url: `/rapor/${report._id}`,
          error: 'PDF oluşturulamadı, JSON yanıtı döndürülüyor',
          pdfError: process.env.NODE_ENV === 'development' ? 
            (pdfError instanceof Error ? pdfError.message : 'Unknown PDF error') : undefined
        });
      }
    }

    // JSON response
    return NextResponse.json({
      _id: report._id,
      title: report.title,
      createdAt: report.createdAt,
      isPublic: report.isPublic,
      url: `/rapor/${report._id}`
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError('Report generation failed', error, { 
      processingTime,
      studentId: params.id,
      hasAnalysisData: !!analysisData
    });
    
    return NextResponse.json(
      { 
        error: 'Rapor oluşturulurken hata oluştu. Lütfen tekrar deneyin.',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : undefined,
        processingTime
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const reports = await Report.find({ studentId: params.id })
      .sort({ createdAt: -1 })
      .select('_id title createdAt isPublic');

    return NextResponse.json(reports);
  } catch (error) {
    logError('List reports failed', error, { studentId: params.id });
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}