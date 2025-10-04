import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import RobustReportDataCollector from '@/lib/services/robustReportDataCollector';
import AdvancedPdfGenerator from '@/lib/services/advancedPdfGenerator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Test Robust Report API: Starting test');

    // Authentication
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    if (studentId.length !== 24) {
      return NextResponse.json({ error: 'Invalid student ID format' }, { status: 400 });
    }

    const teacherId = (authResult._id as any).toString();

    console.log('Test Robust Report API: Testing data collection', { studentId, teacherId });

    // Test data collection
    const reportData = await RobustReportDataCollector.collectStudentData({
      studentId,
      teacherId,
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      endDate: new Date()
    });

    console.log('Test Robust Report API: Data collection successful', {
      student: reportData.student.firstName,
      performance: reportData.performance.overallPerformance
    });

    // Test PDF generation
    const pdfGenerator = new AdvancedPdfGenerator();
    const pdfBuffer = await pdfGenerator.generateReport(reportData);

    console.log('Test Robust Report API: PDF generation successful', {
      pdfSize: pdfBuffer.length
    });

    const safeFirstName = reportData.student.firstName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '');
    const safeLastName = reportData.student.lastName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '');
    const filename = `test_raporu_${safeFirstName}_${safeLastName}_${new Date().toISOString().split('T')[0]}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Test Robust Report API error:', error);
    return NextResponse.json(
      { 
        error: 'Test raporu oluşturulurken hata oluştu', 
        details: error instanceof Error ? error.message : 'Bilinmeyen hata' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      status: 'Test endpoint ready',
      timestamp: new Date().toISOString(),
      description: 'Test endpoint for robust report generation system',
      usage: 'POST with { "studentId": "student_id_here" }'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Test endpoint error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
