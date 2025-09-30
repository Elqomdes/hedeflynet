import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Assignment, Class, User } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const teacherId = authResult._id;

    // Get assignments created by this teacher
    const assignments = await Assignment.find({ teacherId })
      .populate('classId', 'name')
      .populate('studentId', 'firstName lastName')
      .sort({ dueDate: 1 });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Teacher assignments error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, description, type, classId, studentId, attachments, dueDate, maxGrade, publishAt, closeAt, allowLate, maxAttempts, tags, rubricId } = await request.json();

    if (!title || !description || !type || !dueDate) {
      return NextResponse.json(
        { error: 'Tüm gerekli alanlar doldurulmalıdır' },
        { status: 400 }
      );
    }

    if (type === 'class' && !classId) {
      return NextResponse.json(
        { error: 'Sınıf ödevi için sınıf seçilmelidir' },
        { status: 400 }
      );
    }

    if (type === 'individual' && !studentId) {
      return NextResponse.json(
        { error: 'Bireysel ödev için öğrenci seçilmelidir' },
        { status: 400 }
      );
    }

    if (maxGrade !== undefined && (typeof maxGrade !== 'number' || maxGrade < 1 || maxGrade > 100)) {
      return NextResponse.json(
        { error: 'maxGrade 1 ile 100 arasında olmalıdır' },
        { status: 400 }
      );
    }

    if (maxAttempts !== undefined && (typeof maxAttempts !== 'number' || maxAttempts < 1)) {
      return NextResponse.json(
        { error: 'maxAttempts en az 1 olmalıdır' },
        { status: 400 }
      );
    }

    if (allowLate) {
      if (!['no', 'untilClose', 'always'].includes(allowLate.policy)) {
        return NextResponse.json(
          { error: 'Geç teslim politikası geçersiz' },
          { status: 400 }
        );
      }
      if (allowLate.penaltyPercent !== undefined && (allowLate.penaltyPercent < 0 || allowLate.penaltyPercent > 100)) {
        return NextResponse.json(
          { error: 'penaltyPercent 0-100 arasında olmalıdır' },
          { status: 400 }
        );
      }
    }

    await connectDB();

    if (type === 'class') {
      // For class assignments, create individual assignments for each student in the class
      const classData = await Class.findById(classId).populate('students');
      if (!classData) {
        return NextResponse.json(
          { error: 'Sınıf bulunamadı' },
          { status: 404 }
        );
      }

      const assignments = [];
      for (const student of classData.students) {
        const assignment = new Assignment({
          title,
          description,
          type: 'class',
          teacherId: authResult._id,
          classId: classId,
          studentId: student._id,
          attachments: attachments || [],
          dueDate: new Date(dueDate),
          maxGrade: maxGrade ?? 100,
          publishAt: publishAt ? new Date(publishAt) : undefined,
          closeAt: closeAt ? new Date(closeAt) : undefined,
          allowLate: allowLate || undefined,
          maxAttempts: maxAttempts || undefined,
          tags: Array.isArray(tags) ? tags : undefined,
          rubricId: rubricId || undefined
        });
        await assignment.save();
        assignments.push(assignment);
      }

      // Return the first assignment as reference (they're all the same)
      const populatedAssignment = await Assignment.findById(assignments[0]._id)
        .populate('classId', 'name')
        .populate('studentId', 'firstName lastName');

      return NextResponse.json(populatedAssignment, { status: 201 });
    } else {
      // For individual assignments
      const assignment = new Assignment({
        title,
        description,
        type,
        teacherId: authResult._id,
        studentId: studentId,
        attachments: attachments || [],
        dueDate: new Date(dueDate),
        maxGrade: maxGrade ?? 100,
        publishAt: publishAt ? new Date(publishAt) : undefined,
        closeAt: closeAt ? new Date(closeAt) : undefined,
        allowLate: allowLate || undefined,
        maxAttempts: maxAttempts || undefined,
        tags: Array.isArray(tags) ? tags : undefined,
        rubricId: rubricId || undefined
      });

      await assignment.save();

      // Populate the created assignment
      const populatedAssignment = await Assignment.findById(assignment._id)
        .populate('studentId', 'firstName lastName');

      return NextResponse.json(populatedAssignment, { status: 201 });
    }
  } catch (error) {
    console.error('Create assignment error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
