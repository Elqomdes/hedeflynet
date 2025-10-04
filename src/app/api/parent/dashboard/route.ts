import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { ParentService } from '@/lib/services/parentService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authResult = await getCurrentUser(request);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Sadece veliler dashboard verilerini alabilir' },
        { status: 401 }
      );
    }

    await connectDB();

    const parentId = (authResult._id as any).toString();
    const parentService = ParentService.getInstance();

    const dashboardData = await parentService.getParentDashboard(parentId);

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Parent dashboard error:', error);
    return NextResponse.json(
      { 
        error: 'Dashboard verileri alınamadı',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}
