import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User, Assignment, AssignmentSubmission, Goal, Class, Report } from '@/lib/models';
import bcrypt from 'bcryptjs';

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ message: 'Şifre gereklidir' }, { status: 400 });
    }

    await connectToDatabase();

    // Verify password
    const user = await User.findById(authResult._id);
    if (!user) {
      return NextResponse.json({ message: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Şifre yanlış' }, { status: 400 });
    }

    // Delete all teacher-related data
    const teacherId = authResult._id;

    // Delete assignments and their submissions
    const assignments = await Assignment.find({ teacherId });
    const assignmentIds = assignments.map(a => a._id);
    
    await AssignmentSubmission.deleteMany({ assignmentId: { $in: assignmentIds } });
    await Assignment.deleteMany({ teacherId });

    // Delete goals
    await Goal.deleteMany({ teacherId });

    // Delete classes
    await Class.deleteMany({ teacherId });

    // Delete reports
    await Report.deleteMany({ teacherId });

    // Finally delete the user account
    await User.findByIdAndDelete(teacherId);

    return NextResponse.json({ message: 'Hesap başarıyla silindi' });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ message: 'Sunucu hatası' }, { status: 500 });
  }
}
