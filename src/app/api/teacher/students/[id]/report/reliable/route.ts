import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import ReliableDataCollector from '@/lib/services/reliableDataCollector';
import ReliablePdfGenerator from '@/lib/services/reliablePdfGenerator';
import { safeIdToString } from '@/lib/utils/idHelper';

export const dynamic = 'force-dynamic';

// Enhanced error logging
function logError(context: string, error: any, additionalData?: any) {
  console.error(`[RELIABLE_REPORT_ERROR] ${context}:`, {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    ...additionalData
  });
}

// Generate safe filename
function generateSafeFilename(firstName: string, lastName: string): string {
  const safeFirstName = firstName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '');
  const safeLastName = lastName.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '');
  return `rapor_${safeFirstName}_${safeLastName}_${new Date().toISOString().split('T')[0]}.pdf`;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let studentId: string | null = null;
  let teacherId: string | null = null;

  try {
    console.log('Reliable Report API: Starting request processing');

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
    console.log('Reliable Report API: Authentication successful', { teacherId });

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

    console.log('Reliable Report API: Student ID extracted', { studentId });

    // Step 3: Validate student ID format
    if (studentId.length !== 24) {
      logError('Invalid student ID format', { studentId, length: studentId.length });
      return NextResponse.json(
        { error: 'Geçersiz öğrenci ID formatı (MongoDB ObjectId bekleniyor)' },
        { status: 400 }
      );
    }

    // Step 4: Parse request body for date range
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

    console.log('Reliable Report API: Request body parsed', { startDate, endDate });

    // Step 5: Database connection
    try {
      await connectDB();
      console.log('Reliable Report API: Database connected successfully');
    } catch (dbError) {
      logError('Database connection failed', dbError);
      return NextResponse.json(
        { error: 'Veritabanı bağlantı hatası' },
        { status: 500 }
      );
    }

    // Step 6: Collect report data
    let reportData;
    try {
      console.log('Reliable Report API: Starting data collection');
      reportData = await ReliableDataCollector.collectStudentData({
        studentId,
        teacherId: teacherId!,
        startDate,
        endDate
      });
      console.log('Reliable Report API: Data collection completed successfully');
    } catch (dataError) {
      logError('Data collection failed', dataError, { studentId, teacherId });
      return NextResponse.json(
        { 
          error: 'Öğrenci verileri toplanamadı', 
          details: dataError instanceof Error ? dataError.message : 'Bilinmeyen hata',
          debug: {
            studentId,
            teacherId,
            timestamp: new Date().toISOString()
          }
        },
        { status: 500 }
      );
    }

    // Step 7: Generate PDF
    let pdfBuffer: Buffer;
    try {
      console.log('Reliable Report API: Starting PDF generation');
      const pdfGenerator = new ReliablePdfGenerator();
      pdfBuffer = await pdfGenerator.generateReport(reportData);
      console.log('Reliable Report API: PDF generation completed successfully');
    } catch (pdfError) {
      logError('PDF generation failed', pdfError, { studentId, teacherId });
      return NextResponse.json(
        { 
          error: 'PDF oluşturulamadı', 
          details: pdfError instanceof Error ? pdfError.message : 'Bilinmeyen hata' 
        },
        { status: 500 }
      );
    }

    // Step 8: Generate safe filename
    const filename = generateSafeFilename(
      reportData.student.firstName,
      reportData.student.lastName
    );

    console.log('Reliable Report API: Report generation completed successfully', {
      studentId,
      teacherId,
      filename,
      processingTime: Date.now() - startTime,
      pdfSize: pdfBuffer.length
    });

    // Step 9: Return PDF response
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
        'X-System-Used': 'reliable'
      }
    });

  } catch (error) {
    logError('Unexpected error in reliable report API', error, {
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

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      system: 'reliable',
      features: [
        'Reliable data collection with retry mechanism',
        'Robust PDF generation with error handling',
        'Comprehensive input validation',
        'Enhanced error logging',
        'Safe filename generation',
        'Performance monitoring'
      ]
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Health check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
