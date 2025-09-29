import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Assignment } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(
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

    const assignmentId = params.id;

    await connectDB();

    // Check if assignment belongs to this teacher
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      teacherId: authResult._id
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Ödev bulunamadı veya yetkiniz yok' },
        { status: 404 }
      );
    }

    await Assignment.findByIdAndDelete(assignmentId);

    return NextResponse.json({ message: 'Ödev başarıyla silindi' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

