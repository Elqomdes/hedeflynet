import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User, StudyGroup, IStudyGroup } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Öğrenci sayısı
    const totalStudents = await User.countDocuments({ role: 'student' });

    // Get real study groups from database
    const groups = await StudyGroup.find({})
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ 
      data: groups,
      totalStudents,
      totalGroups: groups.length 
    });

  } catch (error) {
    console.error('Get social learning groups error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
