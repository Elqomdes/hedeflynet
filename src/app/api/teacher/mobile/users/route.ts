import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';

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

    // Öğrencileri getir
    const students = await User.find({ role: 'student' }).lean();

    // Get real mobile users from database
    const mobileUsers = [];
    
    // Note: Real mobile users will be populated from the MobileDevice collection
    // when students start using the mobile app

    return NextResponse.json({ data: mobileUsers });

  } catch (error) {
    console.error('Get mobile users error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
