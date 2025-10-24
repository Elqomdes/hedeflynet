import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Goal, Class } from '@/lib/models';

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

    return NextResponse.json({
      success: true,
      goal
    });
  } catch (error) {
    console.error('Get teacher goal error:', error);
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

    await connectDB();

    const { title, description, targetDate, status, progress, category, priority, successCriteria } = await request.json();

    const goal = await Goal.findOneAndUpdate(
      { _id: params.id, teacherId: authResult._id },
      {
        ...(title && { title }),
        ...(description && { description }),
        ...(targetDate && { targetDate: new Date(targetDate) }),
        ...(status && { status }),
        ...(progress !== undefined && { progress }),
        ...(category && { category }),
        ...(priority && { priority }),
        ...(successCriteria && { successCriteria })
      },
      { new: true }
    ).populate('studentId', 'firstName lastName email');

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      goal
    });
  } catch (error) {
    console.error('Update teacher goal error:', error);
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

    const goal = await Goal.findOneAndDelete({
      _id: params.id,
      teacherId: authResult._id
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Delete teacher goal error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
