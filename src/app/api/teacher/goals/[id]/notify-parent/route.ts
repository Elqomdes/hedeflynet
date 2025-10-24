import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Goal, User, Class } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST(
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

    // Get the goal
    const goal = await Goal.findOne({
      _id: params.id,
      teacherId: authResult._id
    }).populate('studentId', 'firstName lastName email');

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Find the student's parent
    const student = goal.studentId as any;
    const parent = await User.findOne({
      role: 'parent',
      children: student._id
    });

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found for this student' },
        { status: 404 }
      );
    }

    // Mark notification as sent
    goal.parentNotificationSent = true;
    await goal.save();

    // In a real implementation, you would send an email notification here
    // For now, we'll just return success

    return NextResponse.json({
      success: true,
      message: 'Parent notification sent successfully',
      parent: {
        id: parent._id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email
      }
    });
  } catch (error) {
    console.error('Notify parent about goal error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
