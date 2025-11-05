import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Assignment, AssignmentSubmission } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Sadece adminler bu işlemi yapabilir' },
        { status: 403 }
      );
    }

    await connectDB();

    // First remove all submissions, then assignments
    const submissionsResult = await AssignmentSubmission.deleteMany({});
    const assignmentsResult = await Assignment.deleteMany({});

    return NextResponse.json({
      success: true,
      message: 'Tüm sınıf ve bireysel ödevler ve teslimleri silindi',
      deleted: {
        submissions: submissionsResult.deletedCount ?? 0,
        assignments: assignmentsResult.deletedCount ?? 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Assignments clear error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Ödevleri temizlerken hata oluştu',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}


