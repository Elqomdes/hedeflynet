import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentParent } from '@/lib/auth';
import { ParentService } from '@/lib/services/parentService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authentication - use parent-specific auth
    const parent = await getCurrentParent(request);
    if (!parent) {
      return NextResponse.json(
        { error: 'Sadece veliler dashboard verilerini alabilir' },
        { status: 401 }
      );
    }

    await connectDB();

    const parentId = (parent._id as any).toString();
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
