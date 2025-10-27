import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Assignment, Class, User } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import { AssignmentCreateSchema } from '@/lib/validation';

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

    // Group class assignments together
    const classAssignmentsMap = new Map();
    const individualAssignments = [];

    for (const assignment of assignments) {
      if (assignment.type === 'class' && assignment.classId) {
        // Create a unique key for grouping: classId + title + dueDate
        const key = `${assignment.classId._id}-${assignment.title}-${assignment.dueDate}`;
        
        if (!classAssignmentsMap.has(key)) {
          classAssignmentsMap.set(key, {
            ...assignment.toObject(),
            students: []
          });
        }
        
        // Add this student to the group
        if (assignment.studentId) {
          classAssignmentsMap.get(key).students.push({
            _id: assignment.studentId._id,
            firstName: assignment.studentId.firstName,
            lastName: assignment.studentId.lastName
          });
        }
      } else {
        // Keep individual assignments as is
        individualAssignments.push(assignment);
      }
    }

    // Combine class assignments (grouped) and individual assignments
    const result = Array.from(classAssignmentsMap.values()).concat(individualAssignments);

    return NextResponse.json(result);
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

    const body = await request.json();
    console.log('Assignment creation request body:', JSON.stringify(body, null, 2));
    
    const parsed = AssignmentCreateSchema.safeParse(body);
    if (!parsed.success) {
      console.log('Validation errors:', JSON.stringify(parsed.error.flatten(), null, 2));
      return NextResponse.json(
        { error: 'Geçersiz giriş verileri', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { title, description, type, classId, studentId, attachments, dueDate, maxGrade, tags, rubricId, category, priority, successCriteria } = parsed.data;

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
          tags: Array.isArray(tags) ? tags : undefined,
          rubricId: rubricId || undefined,
          // Goal-like properties
          category: category || 'academic',
          priority: priority || 'medium',
          successCriteria: successCriteria || undefined
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
        tags: Array.isArray(tags) ? tags : undefined,
        rubricId: rubricId || undefined,
        // Goal-like properties
        category: category || 'academic',
        priority: priority || 'medium',
        successCriteria: successCriteria || undefined
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
