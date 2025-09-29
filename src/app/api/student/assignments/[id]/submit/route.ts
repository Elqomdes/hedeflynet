import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Assignment, AssignmentSubmission } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
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

    const { content, attachments } = await request.json();
    const assignmentId = params.id;
    const studentId = authResult._id;

    if (!content) {
      return NextResponse.json(
        { error: 'Ödev içeriği gereklidir' },
        { status: 400 }
      );
    }

    const connection = await connectDB();
    if (!connection) {
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı' },
        { status: 500 }
      );
    }

    // Check if assignment exists and belongs to this student
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      studentId
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Ödev bulunamadı' },
        { status: 404 }
      );
    }

    // Check if already submitted
    const existingSubmission = await AssignmentSubmission.findOne({
      assignmentId,
      studentId
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'Bu ödev zaten teslim edilmiş' },
        { status: 400 }
      );
    }

    // Create submission
    const submission = new AssignmentSubmission({
      assignmentId,
      studentId,
      content,
      attachments: attachments || [],
      status: 'submitted',
      submittedAt: new Date()
    });

    await submission.save();

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Assignment submission error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

