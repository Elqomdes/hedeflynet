import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { IUser } from '@/lib/models/User';
import { ReportDataService } from '@/lib/services/reportDataService';
import { SimplePdfGenerator } from '@/lib/services/simplePdfGenerator';
import { FallbackReportService } from '@/lib/services/fallbackReportService';
import { ReportGenerationOptions } from '@/lib/types/report';
import { safeIdToString } from '@/lib/utils/idHelper';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    // 1. Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult) {
      console.error('New Report API: Authentication failed - No user found');
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' },
        { status: 401 }
      );
    }

    if (authResult.role !== 'teacher') {
      console.error('New Report API: Authorization failed - Invalid role:', authResult.role);
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
      console.error('New Report API: Invalid student ID format:', studentId);
      return NextResponse.json(
        { error: 'Geçersiz öğrenci ID formatı' },
        { status: 400 }
      );
    }

    console.log('New Report API: Starting report generation', { studentId, teacherId });

    // 2. Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Geçersiz istek formatı' },
        { status: 400 }
      );
    }

    // 3. Extract parameters with defaults
    const startDate = requestBody.startDate 
      ? new Date(requestBody.startDate) 
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Son 3 ay
    const endDate = requestBody.endDate 
      ? new Date(requestBody.endDate) 
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

    // 4. Report generation options
    const options: ReportGenerationOptions = {
      includeCharts: requestBody.includeCharts !== false,
      includeDetailedAssignments: requestBody.includeDetailedAssignments !== false,
      format: requestBody.format || 'pdf'
    };

    console.log('New Report API: Parameters extracted', {
      studentId,
      teacherId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      options
    });

    // 5. Collect report data with fallback
    let reportData;
    try {
      console.log('New Report API: Starting data collection');
      reportData = await ReportDataService.collectStudentReportData(
        studentId,
        teacherId,
        startDate,
        endDate,
        options
      );
      console.log('New Report API: Data collection completed successfully');
    } catch (dataError) {
      console.error('New Report API: Data collection failed, using fallback', dataError);
      
      // Use fallback data instead of failing
      try {
        reportData = FallbackReportService.createFallbackReportData(
          studentId,
          teacherId,
          startDate,
          endDate
        );
        console.log('New Report API: Fallback data created successfully');
      } catch (fallbackError) {
        console.error('New Report API: Fallback data creation failed', fallbackError);
        return NextResponse.json(
          { 
            error: 'Rapor oluşturulamadı', 
            details: 'Veritabanı bağlantısı kurulamadı ve fallback sistemi de başarısız oldu'
          },
          { status: 500 }
        );
      }
    }

    // 6. Generate PDF with fallback
    let pdfBuffer: Buffer;
    try {
      console.log('New Report API: Starting PDF generation');
      const pdfGenerator = new SimplePdfGenerator();
      pdfBuffer = await pdfGenerator.generateReport(reportData);
      console.log('New Report API: PDF generation completed successfully');
    } catch (pdfError) {
      console.error('New Report API: PDF generation failed, trying fallback', pdfError);
      
      // Try to create a simple error PDF
      try {
        const errorReportData = FallbackReportService.createErrorReportData(
          studentId,
          teacherId,
          pdfError instanceof Error ? pdfError.message : 'PDF oluşturma hatası'
        );
        
        const pdfGenerator = new SimplePdfGenerator();
        pdfBuffer = await pdfGenerator.generateReport(errorReportData);
        console.log('New Report API: Error PDF generated successfully');
      } catch (fallbackPdfError) {
        console.error('New Report API: Fallback PDF generation also failed', fallbackPdfError);
        return NextResponse.json(
          { 
            error: 'PDF oluşturulamadı', 
            details: 'PDF oluşturma sistemi tamamen başarısız oldu'
          },
          { status: 500 }
        );
      }
    }

    // 7. Generate safe filename
    const safeFirstName = reportData.student.firstName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '');
    const safeLastName = reportData.student.lastName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `rapor_${safeFirstName}_${safeLastName}_${dateStr}.pdf`;

    console.log('New Report API: Report generation completed successfully', {
      studentId,
      teacherId,
      filename,
      processingTime: Date.now() - startTime,
      pdfSize: pdfBuffer.length
    });

    // 8. Return PDF response
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('New Report API: Unexpected error', error);
    return NextResponse.json(
      { 
        error: 'Rapor oluşturulurken beklenmeyen bir hata oluştu', 
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: 'Yeni rapor API\'si çalışıyor',
      studentId: params.id,
      teacherId: authResult.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('New Report API GET error:', error);
    return NextResponse.json(
      { error: 'API test edilemedi' },
      { status: 500 }
    );
  }
}
