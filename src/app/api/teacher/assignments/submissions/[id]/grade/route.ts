import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import AssignmentSubmission from '@/lib/models/AssignmentSubmission';
import Assignment from '@/lib/models/Assignment';
import { GamificationService } from '@/lib/services/gamificationService';
import { MobileService } from '@/lib/services/mobileService';
import { Parent } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function PUT(
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

    const { grade, teacherFeedback, status } = await request.json();

    if (grade !== undefined && (grade < 0 || grade > 100)) {
      return NextResponse.json(
        { error: 'Grade must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (status && !['completed', 'incomplete', 'submitted', 'graded', 'late'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    await connectDB();

    const submissionId = params.id;
    const teacherId = String(authResult._id);

    // Find the submission and verify teacher has access
    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('assignmentId');

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check if the assignment belongs to this teacher
    const assignment = submission.assignmentId as any;
    if (assignment.teacherId.toString() !== String(teacherId)) {
      return NextResponse.json(
        { error: 'Unauthorized to grade this submission' },
        { status: 403 }
      );
    }

    // Update the submission
    const updateData: any = {
      gradedAt: new Date()
    };

    if (grade !== undefined) {
      const max = assignment.maxGrade || 100;
      if (grade > max) {
        return NextResponse.json(
          { error: `Grade cannot exceed maxGrade (${max})` },
          { status: 400 }
        );
      }
      updateData.grade = grade;
      updateData.maxGrade = max;
      // If teacher sets a grade, default status to 'graded' unless explicitly provided
      if (!status) {
        updateData.status = 'graded';
      }
    }

    if (teacherFeedback !== undefined) {
      updateData.teacherFeedback = teacherFeedback;
    }

    if (status) {
      updateData.status = status;
    }

    const updatedSubmission = await AssignmentSubmission.findByIdAndUpdate(
      submissionId,
      updateData,
      { new: true }
    ).populate('studentId', 'firstName lastName email');

    // Cross-feature integrations (non-blocking)
    try {
      const gamification = GamificationService.getInstance();
      const studentId = String((updatedSubmission as any).studentId._id || (updatedSubmission as any).studentId);
      // Add experience based on grade
      if (updateData.grade !== undefined) {
        const xp = Math.max(5, Math.min(25, Math.floor((updateData.grade as number) / 4)));
        await gamification.addExperience(studentId, xp, 'assignment_grade');
        await gamification.checkAchievements(studentId, 'assignment');
      }
    } catch (e) {
      console.error('Gamification on grade error:', e);
    }

    try {
      const mobile = MobileService.getInstance();
      const studentId = String((updatedSubmission as any).studentId._id || (updatedSubmission as any).studentId);
      if (updateData.grade !== undefined) {
        await mobile.sendPushNotification(studentId, {
          title: 'Ödev Notunuz Yayınlandı',
          body: `Ödeviniz değerlendirildi. Notunuz: ${(updateData.grade as number).toString()}`,
          data: { type: 'assignment', submissionId: submissionId },
          priority: 'high'
        });

        // Notify parents
        try {
          const parents = await Parent.find({ children: studentId }).lean();
          for (const parent of parents) {
            await mobile.sendPushNotification(String((parent as any).user), {
              title: 'Çocuğunuzun Ödev Notu Yayınlandı',
              body: 'Çocuğunuzun bir ödev notu yayınlandı.',
              data: { type: 'assignment', submissionId: submissionId, studentId },
              priority: 'normal'
            });
          }
        } catch (pnErr) {
          console.error('Parent notify on grade error:', pnErr);
        }
      }
    } catch (e) {
      console.error('Mobile notification on grade error:', e);
    }

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error('Grade submission error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
