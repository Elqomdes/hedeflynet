import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Report } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

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

    // Generate PDF content (simplified version)
    const pdfContent = generatePDFContent(student, analysisData);

    return new NextResponse(pdfContent, {
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

function generatePDFContent(student: any, analysisData: any): string {
  // This is a simplified PDF generation
  // In a real application, you would use a library like puppeteer or jsPDF
  return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
72 720 Td
(${student.firstName} ${student.lastName} - Performans Raporu) Tj
0 -20 Td
(Ödev Tamamlama: %${analysisData.assignmentCompletion}) Tj
0 -20 Td
(Hedef İlerlemesi: %${analysisData.goalsProgress}) Tj
0 -20 Td
(Genel Performans: %${analysisData.overallPerformance}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
454
%%EOF`;
}
