import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Assignment, AssignmentSubmission, Class, User } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import { AssignmentCreateSchema } from '@/lib/validation';
import { safeIdToString } from '@/lib/utils/idHelper';

// Type for populated student
interface PopulatedStudent {
  _id: any;
  firstName: string;
  lastName: string;
}

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


    // Get all submissions to check completion status
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await AssignmentSubmission.find({
      assignmentId: { $in: assignmentIds }
    }).lean();

    // Create a map of submissions by assignment ID
    const submissionMap = new Map();
    submissions.forEach(submission => {
      submissionMap.set(submission.assignmentId.toString(), submission);
    });

    // Group class assignments together and filter out completed ones
    const classAssignmentsMap = new Map();
    const individualAssignments = [];

    for (const assignment of assignments) {
      // Check if this assignment is completed
      const submission = submissionMap.get(safeIdToString(assignment._id));
      const isCompleted = submission && (submission.status === 'graded' || submission.status === 'completed');
      
      // Skip completed assignments from main list
      if (isCompleted) {
        continue;
      }

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
        if (assignment.studentId && typeof assignment.studentId === 'object' && '_id' in assignment.studentId) {
          const student = assignment.studentId as unknown as PopulatedStudent;
          classAssignmentsMap.get(key).students.push({
            _id: student._id,
            firstName: student.firstName,
            lastName: student.lastName
          });
        }
      } else {
        // Keep individual assignments as is
        individualAssignments.push(assignment);
      }
    }

    // Combine class assignments (grouped) and individual assignments
    const result = Array.from(classAssignmentsMap.values()).concat(individualAssignments);

    // Transform assignments to fix timezone issues
    const transformedResult = result.map(assignment => {
      const assignmentObj = assignment.toObject ? assignment.toObject() : assignment;
      
      // Convert dueDate to local time string to avoid timezone issues
      const dueDate = new Date(assignmentObj.dueDate);
      const localDueDate = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate(),
        dueDate.getHours(),
        dueDate.getMinutes(),
        dueDate.getSeconds()
      );
      
      return {
        ...assignmentObj,
        dueDate: localDueDate.toISOString() // Send as ISO string
      };
    });

    return NextResponse.json(transformedResult);
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

    // Parse dueDate as local time to avoid timezone conversion issues
    // The schema already transforms dueDate to a Date object, so we can use it directly
    let localDueDate = dueDate;

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
          dueDate: localDueDate,
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
        dueDate: localDueDate,
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
