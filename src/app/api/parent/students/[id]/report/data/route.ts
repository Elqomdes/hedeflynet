import { NextRequest, NextResponse } from 'next/server';
import { getCurrentParent } from '@/lib/auth';
import { ReportDataService } from '@/lib/services/reportDataService';
import { FallbackReportService } from '@/lib/services/fallbackReportService';
import { ReportGenerationOptions } from '@/lib/types/report';
import connectDB from '@/lib/mongodb';
import { safeIdToString } from '@/lib/utils/idHelper';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    // 1. Authentication check - use parent-specific auth
    const parent = await getCurrentParent(request);
    if (!parent) {
      console.error('Parent Report Data API: Authentication failed - No parent found');
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' },
        { status: 401 }
      );
    }

    const studentId = params.id;
    
    if (!parent._id) {
      return NextResponse.json(
        { error: 'Kullanıcı verisi eksik' },
        { status: 500 }
      );
    }
    
    const parentId = safeIdToString(parent._id);

    // Validate student ID
    if (!studentId || studentId.length !== 24) {
      console.error('Parent Report Data API: Invalid student ID format:', studentId);
      return NextResponse.json(
        { error: 'Geçersiz öğrenci ID formatı' },
        { status: 400 }
      );
    }

    console.log('Parent Report Data API: Starting data collection', { studentId, parentId });

    // 2. Database connection
    await connectDB();

    // 3. Extract parameters from URL
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
      format: 'json'
    };

    console.log('Parent Report Data API: Parameters extracted', {
      studentId,
      parentId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      options
    });

    // 4. Collect report data with fallback
    let reportData;
    try {
      console.log('Parent Report Data API: Starting data collection');
      reportData = await ReportDataService.collectStudentReportData(
        studentId,
        parentId, // Use parent ID as teacher ID for data collection
        startDate,
        endDate,
        options
      );
      console.log('Parent Report Data API: Data collection completed successfully');
    } catch (dataError) {
      console.error('Parent Report Data API: Data collection failed, using fallback', dataError);
      
      // Use fallback data instead of failing
      try {
        reportData = FallbackReportService.createFallbackReportData(
          studentId,
          parentId,
          startDate,
          endDate
        );
        console.log('Parent Report Data API: Fallback data created successfully');
      } catch (fallbackError) {
        console.error('Parent Report Data API: Fallback data creation failed', fallbackError);
        return NextResponse.json(
          { 
            error: 'Rapor verileri alınamadı', 
            details: 'Veritabanı bağlantısı kurulamadı ve fallback sistemi de başarısız oldu'
          },
          { status: 500 }
        );
      }
    }

    console.log('Parent Report Data API: Data collection completed successfully', {
      studentId,
      parentId,
      processingTime: Date.now() - startTime,
      hasData: !!reportData
    });

    // 5. Return JSON response
    return NextResponse.json(reportData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Report-Generated-At': new Date().toISOString(),
        'X-Student-ID': studentId,
        'X-Parent-ID': parentId
      }
    });

  } catch (error) {
    console.error('Parent Report Data API: Unexpected error', error);
    return NextResponse.json(
      { 
        error: 'Rapor verileri alınırken beklenmeyen bir hata oluştu', 
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
