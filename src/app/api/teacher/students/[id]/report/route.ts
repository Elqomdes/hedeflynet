import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Report } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import { jsPDF } from 'jspdf';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let analysisData: any = null;
  
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    analysisData = await request.json();
    
    // Validate required analysis data
    if (!analysisData || typeof analysisData !== 'object') {
      return NextResponse.json(
        { error: 'Geçersiz analiz verisi' },
        { status: 400 }
      );
    }

    // Ensure required fields exist with defaults
    const validatedData = {
      assignmentCompletion: analysisData.assignmentCompletion || 0,
      totalAssignments: analysisData.totalAssignments || 0,
      submittedAssignments: analysisData.submittedAssignments || 0,
      gradedAssignments: analysisData.gradedAssignments || 0,
      gradingRate: analysisData.gradingRate || 0,
      averageGrade: analysisData.averageGrade || 0,
      subjectStats: analysisData.subjectStats || {},
      subjectDetails: analysisData.subjectDetails || {},
      goalsProgress: analysisData.goalsProgress || 0,
      overallPerformance: analysisData.overallPerformance || 0,
      monthlyProgress: analysisData.monthlyProgress || [],
      assignmentTitleCounts: analysisData.assignmentTitleCounts || []
    };

    await connectDB();

    const studentId = params.id;
    const teacherId = authResult._id;

    // Get student info
    const student = await User.findById(studentId).select('firstName lastName');
    if (!student) {
      return NextResponse.json(
        { error: 'Öğrenci bulunamadı' },
        { status: 404 }
      );
    }

    // Validate student data
    if (!student.firstName || !student.lastName) {
      return NextResponse.json(
        { error: 'Öğrenci bilgileri eksik' },
        { status: 400 }
      );
    }

    // Create report
    const report = new Report({
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

    // Decide response format
    const format = request.nextUrl.searchParams.get('format') || 'json';

    if (format === 'pdf') {
      // Generate PDF content using jsPDF
      const pdfBuffer = await generatePDFContent(student, validatedData);
      
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('PDF oluşturulamadı - boş buffer');
      }

      // Create safe filename
      const safeFirstName = student.firstName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '');
      const safeLastName = student.lastName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '');
      const filename = `${safeFirstName}_${safeLastName}_raporu.pdf`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString()
        }
      });
    }

    // Default JSON response
    return NextResponse.json({
      _id: report._id,
      title: report.title,
      createdAt: report.createdAt,
      isPublic: report.isPublic,
      url: `/rapor/${report._id}`
    });
  } catch (error) {
    console.error('Report generation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      analysisData: analysisData ? 'Present' : 'Missing',
      studentId: params.id
    });
    return NextResponse.json(
      { 
        error: 'Rapor oluşturulurken hata oluştu. Lütfen tekrar deneyin.',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
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
    console.error('List reports error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
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

async function generatePDFContent(student: any, analysisData: any): Promise<Buffer> {
  try {
    // Check if jsPDF is available
    if (!jsPDF) {
      throw new Error('jsPDF kütüphanesi yüklenemedi');
    }
    
    // Validate student data
    if (!student || !student.firstName || !student.lastName) {
      throw new Error('Öğrenci bilgileri eksik');
    }
    
    const doc = new jsPDF();
    
    // Set font and colors
    doc.setFont('helvetica');
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(`${student.firstName} ${student.lastName} - Performans Raporu`, 20, 30);
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, 45);
  
  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 55, 190, 55);
  
  // General Performance Section
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('Genel Performans', 20, 75);
  
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  let yPos = 90;
  
  // Performance metrics
  doc.text(`Ödev Tamamlama Oranı: %${analysisData.assignmentCompletion || 0}`, 20, yPos);
  yPos += 15;
  
  doc.text(`Hedef İlerlemesi: %${analysisData.goalsProgress || 0}`, 20, yPos);
  yPos += 15;
  
  doc.text(`Genel Performans: %${analysisData.overallPerformance || 0}`, 20, yPos);
  yPos += 15;
  
  doc.text(`Teslim Edilen Ödevler: ${analysisData.submittedAssignments || 0}`, 20, yPos);
  yPos += 15;
  
  doc.text(`Değerlendirilen Ödevler: ${analysisData.gradedAssignments || 0}`, 20, yPos);
  yPos += 15;
  
  doc.text(`Ortalama Not: ${analysisData.averageGrade || 0}/100`, 20, yPos);
  yPos += 25;
  
  // Subject Performance Section
  if (analysisData.subjectDetails && Object.keys(analysisData.subjectDetails).length > 0) {
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Branş Bazlı Performans', 20, yPos);
    yPos += 20;
    
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    
    Object.entries(analysisData.subjectDetails || {}).forEach(([subject, details]: [string, any]) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(subject, 20, yPos);
      yPos += 15;
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`  • Toplam Ödev: ${details?.totalAssignments || 0}`, 25, yPos);
      yPos += 12;
      doc.text(`  • Teslim Edilen: ${details?.submittedAssignments || 0}`, 25, yPos);
      yPos += 12;
      doc.text(`  • Değerlendirilen: ${details?.gradedAssignments || 0}`, 25, yPos);
      yPos += 12;
      doc.text(`  • Tamamlama Oranı: %${details?.completion || 0}`, 25, yPos);
      yPos += 12;
      doc.text(`  • Ortalama Not: ${details?.averageGrade || 0}/100`, 25, yPos);
      yPos += 20;
    });
  }
  
  // Monthly Progress Section
  if (analysisData.monthlyProgress && analysisData.monthlyProgress.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 30;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Aylık İlerleme', 20, yPos);
    yPos += 20;
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    
    (analysisData.monthlyProgress || []).forEach((month: any) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
      }
      
      doc.text(`${month?.month || 'Bilinmeyen'}: ${month?.assignments || 0} ödev, ${month?.goalsCompleted || 0} hedef`, 20, yPos);
      yPos += 12;
    });
    yPos += 15;
  }
  
  // Recommendations Section
  if (yPos > 200) {
    doc.addPage();
    yPos = 30;
  }
  
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('Öneriler', 20, yPos);
  yPos += 20;
  
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  
  let recommendation = '';
  const overallPerf = analysisData.overallPerformance || 0;
  if (overallPerf > 80) {
    recommendation = 'Öğrenci mükemmel bir performans sergiliyor. Bu başarıyı sürdürmesi için teşvik edilmelidir.';
  } else if (overallPerf > 60) {
    recommendation = 'Öğrenci iyi bir performans sergiliyor. Daha da gelişmesi için ek çalışmalar önerilir.';
  } else {
    recommendation = 'Öğrencinin performansını artırmak için ek destek ve çalışma planı oluşturulmalıdır.';
  }
  
  // Split long text into multiple lines
  try {
    const splitText = doc.splitTextToSize(recommendation, 170);
    doc.text(splitText, 20, yPos);
  } catch (textError) {
    console.warn('Text splitting failed, using original text:', textError);
    doc.text(recommendation, 20, yPos);
  }
  
  // Footer
  const pageCount = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Sayfa ${i} / ${pageCount}`, 20, 285);
    doc.text('Hedefly Eğitim Sistemi', 170, 285);
  }
  
    // Generate PDF buffer
    const pdfOutput = doc.output('arraybuffer');
    if (!pdfOutput || pdfOutput.byteLength === 0) {
      throw new Error('PDF oluşturulamadı - boş çıktı');
    }
    
    return Buffer.from(pdfOutput);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`PDF oluşturma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
}
