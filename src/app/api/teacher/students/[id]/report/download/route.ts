import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { IUser } from '@/lib/models/User';
import { ReportDataService } from '@/lib/services/reportDataService';
import { SimplePdfGenerator } from '@/lib/services/simplePdfGenerator';
import { FallbackReportService } from '@/lib/services/fallbackReportService';
import { ReportGenerationOptions } from '@/lib/types/report';
import { safeIdToString } from '@/lib/utils/idHelper';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    // 1. Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult) {
      console.error('Report Download API: Authentication failed - No user found');
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' },
        { status: 401 }
      );
    }

    if (authResult.role !== 'teacher') {
      console.error('Report Download API: Authorization failed - Invalid role:', authResult.role);
      return NextResponse.json(
        { error: 'Sadece öğretmenler rapor oluşturabilir.' },
        { status: 403 }
      );
    }

    const studentId = params.id;
    
    if (!authResult._id) {
      return NextResponse.json(
        { error: 'Kullanıcı verisi eksik' },
        { status: 500 }
      );
    }
    
    const teacherId = safeIdToString(authResult._id);

    // Validate student ID
    if (!studentId || studentId.length !== 24) {
      console.error('Report Download API: Invalid student ID format:', studentId);
      return NextResponse.json(
        { error: 'Geçersiz öğrenci ID formatı' },
        { status: 400 }
      );
    }

    console.log('Report Download API: Starting report generation', { studentId, teacherId });

    // 2. Extract parameters from URL
    const url = new URL(request.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Son 3 ay
    const endDate = endDateParam 
      ? new Date(endDateParam) 
      : new Date();

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Geçersiz tarih formatı' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Başlangıç tarihi bitiş tarihinden önce olmalıdır' },
        { status: 400 }
      );
    }

    // 3. Report generation options
    const options: ReportGenerationOptions = {
      includeCharts: true,
      includeDetailedAssignments: true,
      format: 'pdf'
    };

    console.log('Report Download API: Parameters extracted', {
      studentId,
      teacherId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      options
    });

    // 4. Collect report data with fallback
    let reportData;
    try {
      console.log('Report Download API: Starting data collection');
      reportData = await ReportDataService.collectStudentReportData(
        studentId,
        teacherId,
        startDate,
        endDate,
        options
      );
      console.log('Report Download API: Data collection completed successfully');
    } catch (dataError) {
      console.error('Report Download API: Data collection failed, using fallback', dataError);
      
      // Use fallback data instead of failing
      try {
        reportData = FallbackReportService.createFallbackReportData(
          studentId,
          teacherId,
          startDate,
          endDate
        );
        console.log('Report Download API: Fallback data created successfully');
      } catch (fallbackError) {
        console.error('Report Download API: Fallback data creation failed', fallbackError);
        return NextResponse.json(
          { 
            error: 'Rapor oluşturulamadı', 
            details: 'Veritabanı bağlantısı kurulamadı ve fallback sistemi de başarısız oldu'
          },
          { status: 500 }
        );
      }
    }

    // 5. Generate PDF with fallback
    let pdfBuffer: Buffer;
    try {
      console.log('Report Download API: Starting PDF generation');
      const pdfGenerator = new SimplePdfGenerator();
      pdfBuffer = await pdfGenerator.generateReport(reportData);
      console.log('Report Download API: PDF generation completed successfully');
    } catch (pdfError) {
      console.error('Report Download API: PDF generation failed, trying fallback', pdfError);
      
      // Try to create a simple error PDF
      try {
        const errorReportData = FallbackReportService.createErrorReportData(
          studentId,
          teacherId,
          pdfError instanceof Error ? pdfError.message : 'PDF oluşturma hatası'
        );
        
        const pdfGenerator = new SimplePdfGenerator();
        pdfBuffer = await pdfGenerator.generateReport(errorReportData);
        console.log('Report Download API: Error PDF generated successfully');
      } catch (fallbackPdfError) {
        console.error('Report Download API: Fallback PDF generation also failed', fallbackPdfError);
        return NextResponse.json(
          { 
            error: 'PDF oluşturulamadı', 
            details: 'PDF oluşturma sistemi tamamen başarısız oldu'
          },
          { status: 500 }
        );
      }
    }

    // 6. Generate safe filename
    const safeFirstName = reportData.student.firstName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '');
    const safeLastName = reportData.student.lastName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `rapor_${safeFirstName}_${safeLastName}_${dateStr}.pdf`;

    console.log('Report Download API: Report generation completed successfully', {
      studentId,
      teacherId,
      filename,
      processingTime: Date.now() - startTime,
      pdfSize: pdfBuffer.length
    });

    // 7. Return PDF response
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Report-Generated-At': new Date().toISOString(),
        'X-Student-ID': studentId,
        'X-Teacher-ID': teacherId
      }
    });

  } catch (error) {
    console.error('Report Download API: Unexpected error', error);
    return NextResponse.json(
      { 
        error: 'Rapor oluşturulurken beklenmeyen bir hata oluştu', 
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}

// POST endpoint as fallback
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return GET(request, { params });
}
