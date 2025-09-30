import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Assignment from '@/lib/models/Assignment';
import AssignmentSubmission from '@/lib/models/AssignmentSubmission';

export const dynamic = 'force-dynamic';

export async function GET(
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

    await connectDB();

    const assignment = await Assignment.findById(params.id)
      .populate('classId', 'name')
      .populate('studentId', 'firstName lastName');

    if (!assignment || String(assignment.teacherId) !== String(authResult._id)) {
      return NextResponse.json(
        { error: 'Assignment not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Get assignment error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { title, description, dueDate, attachments, maxGrade } = body;

    if (maxGrade !== undefined && (typeof maxGrade !== 'number' || maxGrade < 1 || maxGrade > 100)) {
      return NextResponse.json(
        { error: 'maxGrade 1 ile 100 arasında olmalıdır' },
        { status: 400 }
      );
    }

    await connectDB();

    const assignment = await Assignment.findById(params.id);
    if (!assignment || String(assignment.teacherId) !== String(authResult._id)) {
      return NextResponse.json(
        { error: 'Assignment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Only allow safe field updates here
    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (dueDate !== undefined) assignment.dueDate = new Date(dueDate);
    if (attachments !== undefined) assignment.attachments = attachments;
    if (maxGrade !== undefined) assignment.maxGrade = maxGrade;

    await assignment.save();

    const populated = await Assignment.findById(assignment._id)
      .populate('classId', 'name')
      .populate('studentId', 'firstName lastName');

    return NextResponse.json(populated);
  } catch (error) {
    console.error('Update assignment error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

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

    await connectDB();

    const assignment = await Assignment.findById(params.id);
    if (!assignment || String(assignment.teacherId) !== String(authResult._id)) {
      return NextResponse.json(
        { error: 'Assignment not found or unauthorized' },
        { status: 404 }
      );
    }

    // If this is a class assignment instance, also delete sibling instances for the same class batch
    let deletedAssignments = 0;
    let deletedSubmissions = 0;

    if (assignment.type === 'class' && assignment.classId) {
      // Find all similar class assignments created by this teacher for the same class and same title/dueDate
      const siblings = await Assignment.find({
        teacherId: assignment.teacherId,
        type: 'class',
        classId: assignment.classId,
        title: assignment.title,
        dueDate: assignment.dueDate,
      }).select('_id');

      const ids = siblings.map(s => s._id);
      if (ids.length > 0) {
        const subRes = await AssignmentSubmission.deleteMany({ assignmentId: { $in: ids } });
        deletedSubmissions += subRes.deletedCount || 0;
        const delRes = await Assignment.deleteMany({ _id: { $in: ids } });
        deletedAssignments += delRes.deletedCount || 0;
      }
    } else {
      const subRes = await AssignmentSubmission.deleteMany({ assignmentId: assignment._id });
      deletedSubmissions += subRes.deletedCount || 0;
      const delRes = await Assignment.findByIdAndDelete(assignment._id);
      deletedAssignments += delRes ? 1 : 0;
    }

    return NextResponse.json({ success: true, deletedAssignments, deletedSubmissions });
  } catch (error) {
    console.error('Delete assignment error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
