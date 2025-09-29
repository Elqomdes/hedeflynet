import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Plan } from '@/lib/models';
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

    // Get plans for this student
    const plans = await Plan.find({ studentId })
      .populate('teacherId', 'firstName lastName')
      .sort({ startDate: 1 });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Student plans error:', error);
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

    const { title, description, startDate, endDate, tasks, teacherId } = await request.json();

    if (!title || !description || !startDate || !endDate || !teacherId) {
      return NextResponse.json(
        { error: 'Tüm alanlar gereklidir' },
        { status: 400 }
      );
    }

    await connectDB();

    const plan = new Plan({
      studentId: authResult._id,
      teacherId,
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'pending',
      tasks: tasks || []
    });

    await plan.save();

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Create plan error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

