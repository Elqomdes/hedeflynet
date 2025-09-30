import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Report } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import jsPDF from 'jspdf';

export const dynamic = 'force-dynamic';

export async function POST(
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

    const analysisData = await request.json();
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

    // Create report
    const report = new Report({
      studentId,
      teacherId,
      title: `${student.firstName} ${student.lastName} - Performans Raporu`,
      content: generateReportContent(student, analysisData),
      data: {
        assignmentCompletion: analysisData.assignmentCompletion,
        subjectStats: analysisData.subjectStats,
        goalsProgress: analysisData.goalsProgress,
        overallPerformance: analysisData.overallPerformance
      },
      isPublic: true
    });

    await report.save();

    // Generate PDF content using jsPDF
    const pdfBuffer = await generatePDFContent(student, analysisData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${student.firstName}_${student.lastName}_raporu.pdf"`
      }
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

function generateReportContent(student: any, analysisData: any): string {
  return `
# ${student.firstName} ${student.lastName} - Performans Raporu

## Genel Değerlendirme
- **Ödev Tamamlama Oranı**: %${analysisData.assignmentCompletion}
- **Hedef İlerlemesi**: %${analysisData.goalsProgress}
- **Genel Performans**: %${analysisData.overallPerformance}

## Branş Bazlı Performans
${Object.entries(analysisData.subjectStats).map(([subject, value]) => 
  `- **${subject}**: %${value}`
).join('\n')}

## Öneriler
${analysisData.overallPerformance > 80 ? 
  'Öğrenci mükemmel bir performans sergiliyor. Bu başarıyı sürdürmesi için teşvik edilmelidir.' :
  analysisData.overallPerformance > 60 ?
  'Öğrenci iyi bir performans sergiliyor. Daha da gelişmesi için ek çalışmalar önerilir.' :
  'Öğrencinin performansını artırmak için ek destek ve çalışma planı oluşturulmalıdır.'
}

## Tarih
${new Date().toLocaleDateString('tr-TR')}
  `;
}

async function generatePDFContent(student: any, analysisData: any): Promise<Buffer> {
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
  doc.text(`Ödev Tamamlama Oranı: %${analysisData.assignmentCompletion}`, 20, yPos);
  yPos += 15;
  
  doc.text(`Hedef İlerlemesi: %${analysisData.goalsProgress}`, 20, yPos);
  yPos += 15;
  
  doc.text(`Genel Performans: %${analysisData.overallPerformance}`, 20, yPos);
  yPos += 15;
  
  doc.text(`Teslim Edilen Ödevler: ${analysisData.submittedAssignments}`, 20, yPos);
  yPos += 15;
  
  doc.text(`Değerlendirilen Ödevler: ${analysisData.gradedAssignments}`, 20, yPos);
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
    
    Object.entries(analysisData.subjectDetails).forEach(([subject, details]: [string, any]) => {
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
      doc.text(`  • Toplam Ödev: ${details.totalAssignments}`, 25, yPos);
      yPos += 12;
      doc.text(`  • Teslim Edilen: ${details.submittedAssignments}`, 25, yPos);
      yPos += 12;
      doc.text(`  • Değerlendirilen: ${details.gradedAssignments}`, 25, yPos);
      yPos += 12;
      doc.text(`  • Tamamlama Oranı: %${details.completion}`, 25, yPos);
      yPos += 12;
      doc.text(`  • Ortalama Not: ${details.averageGrade || 0}/100`, 25, yPos);
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
    
    analysisData.monthlyProgress.forEach((month: any) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
      }
      
      doc.text(`${month.month}: ${month.assignments} ödev, ${month.goalsCompleted} hedef`, 20, yPos);
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
  if (analysisData.overallPerformance > 80) {
    recommendation = 'Öğrenci mükemmel bir performans sergiliyor. Bu başarıyı sürdürmesi için teşvik edilmelidir.';
  } else if (analysisData.overallPerformance > 60) {
    recommendation = 'Öğrenci iyi bir performans sergiliyor. Daha da gelişmesi için ek çalışmalar önerilir.';
  } else {
    recommendation = 'Öğrencinin performansını artırmak için ek destek ve çalışma planı oluşturulmalıdır.';
  }
  
  // Split long text into multiple lines
  const splitText = doc.splitTextToSize(recommendation, 170);
  doc.text(splitText, 20, yPos);
  
  // Footer
  const pageCount = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Sayfa ${i} / ${pageCount}`, 20, 285);
    doc.text('Hedefly Eğitim Sistemi', 170, 285);
  }
  
  return Buffer.from(doc.output('arraybuffer'));
}
