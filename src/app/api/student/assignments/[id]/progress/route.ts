import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Assignment } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { progress } = await request.json();
    
    if (progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: 'İlerleme 0-100 arasında olmalıdır' },
        { status: 400 }
      );
    }

    const assignment = await Assignment.findOneAndUpdate(
      { 
        _id: params.id,
        $or: [
          { studentId: authResult._id },
          { type: 'class' } // Class assignments are visible to all students
        ]
      },
      { progress },
      { new: true }
    );

    if (!assignment) {
      return NextResponse.json(
        { error: 'Ödev bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
