import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Assignment, AssignmentSubmission } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import { createParentNotificationsForStudent } from '@/lib/utils/createParentNotification';

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

    // Determine status (late or submitted) and carry maxGrade from assignment
    const now = new Date();
    const isBeforePublish = assignment.publishAt && now < new Date(assignment.publishAt);
    if (isBeforePublish) {
      return NextResponse.json(
        { error: 'Ödev henüz yayınlanmadı' },
        { status: 403 }
      );
    }

    const isClosed = assignment.closeAt && now > new Date(assignment.closeAt);
    if (isClosed && (!assignment.allowLate || assignment.allowLate.policy === 'no')) {
      return NextResponse.json(
        { error: 'Ödev süresi doldu' },
        { status: 403 }
      );
    }

    const isLate = assignment.dueDate && new Date(assignment.dueDate) < now;

    const submission = new AssignmentSubmission({
      assignmentId,
      studentId,
      content,
      attachments: attachments || [],
      status: isLate ? 'late' : 'submitted',
      submittedAt: now,
      maxGrade: assignment.maxGrade || 100,
      attempt: 1,
      versions: [{ attempt: 1, submittedAt: now, content, attachments: attachments || [] }]
    });

    await submission.save();
    // Create notification for parent
    await createParentNotificationsForStudent(String(studentId), {
      type: 'assignment_completed',
      title: 'Ödev Teslim Edildi',
      message: `${assignment.title} ödevi başarıyla teslim edildi.`,
      priority: isLate ? 'high' : 'medium',
      data: {
        assignmentId: String(assignment._id),
        assignmentTitle: assignment.title,
        submissionId: String(submission._id),
        isLate
      }
    });
    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Assignment submission error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

