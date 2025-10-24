import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Goal } from '@/lib/models';

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
    
    // Get goals as study plans
    const plans = await Goal.find({ 
      studentId,
      category: { $in: ['academic', 'skill'] }
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Get student plans error:', error);
    return NextResponse.json(
      { error: 'Server error' },
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

    await connectDB();

    const { title, description, targetDate, category, priority, successCriteria } = await request.json();

    if (!title || !description || !targetDate || !successCriteria) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const plan = new Goal({
      studentId: authResult._id,
      teacherId: authResult._id, // This should be the actual teacher ID
      title,
      description,
      targetDate: new Date(targetDate),
      category: category || 'academic',
      priority: priority || 'medium',
      successCriteria
    });

    await plan.save();

    return NextResponse.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Create student plan error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
