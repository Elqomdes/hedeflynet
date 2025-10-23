import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Goal, Assignment } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const studentId = authResult._id;

    // Get goals for this student
    const goals = await Goal.find({ studentId })
      .populate('teacherId', 'firstName lastName')
      .sort({ targetDate: 1 });

    // Get assignments linked to these goals
    const goalIds = goals.map(goal => goal._id);
    const assignments = await Assignment.find({ goalId: { $in: goalIds } })
      .select('_id title dueDate type maxGrade goalId')
      .sort({ dueDate: 1 });

    // Group assignments by goalId
    const assignmentsByGoal = assignments.reduce((acc, assignment) => {
      const goalId = assignment.goalId.toString();
      if (!acc[goalId]) {
        acc[goalId] = [];
      }
      acc[goalId].push(assignment);
      return acc;
    }, {} as Record<string, any[]>);

    // Add assignments to goals
    const goalsWithAssignments = goals.map(goal => ({
      ...goal.toObject(),
      assignments: assignmentsByGoal[goal._id.toString()] || []
    }));

    return NextResponse.json(goalsWithAssignments);
  } catch (error) {
    console.error('Student goals error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Students are not allowed to create goals anymore
    return NextResponse.json(
      { error: 'Öğrenciler hedef oluşturamaz. Hedefler öğretmen tarafından eklenir.' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Create goal error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

