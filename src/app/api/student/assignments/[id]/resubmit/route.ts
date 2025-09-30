import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Assignment from '@/lib/models/Assignment';
import AssignmentSubmission from '@/lib/models/AssignmentSubmission';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
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

    // Check assignment ownership
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

    // Find existing submission
    const submission = await AssignmentSubmission.findOne({ assignmentId, studentId });

    if (!submission) {
      return NextResponse.json(
        { error: 'Önce bir teslim oluşturulmalıdır' },
        { status: 400 }
      );
    }

    if (submission.status === 'graded') {
      return NextResponse.json(
        { error: 'Notlandırılmış teslimler yeniden gönderilemez' },
        { status: 400 }
      );
    }

    const now = new Date();
    const isLate = assignment.dueDate && new Date(assignment.dueDate) < now;

    submission.content = content;
    submission.attachments = attachments || [];
    submission.submittedAt = now;
    submission.status = isLate ? 'late' : 'submitted';

    await submission.save();

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Assignment resubmission error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}


