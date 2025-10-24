import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User, Assignment, AssignmentSubmission, Class, Goal } from '@/lib/models';
import { IUser } from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(['teacher'])(request);
    if (!('user' in auth)) {
      return NextResponse.json({ message: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }
    const { user: authUser } = auth as { user: IUser };

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ message: 'Şifre gereklidir' }, { status: 400 });
    }

    await connectDB();

    // Verify password
    const user = await User.findById(authUser._id);
    if (!user) {
      return NextResponse.json({ message: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Şifre yanlış' }, { status: 400 });
    }

    // Delete all teacher-related data
    const teacherId = authUser._id;

    // Delete assignments and their submissions
    const assignments = await Assignment.find({ teacherId });
    const assignmentIds = assignments.map(a => a._id);
    
    await AssignmentSubmission.deleteMany({ assignmentId: { $in: assignmentIds } });
    await Assignment.deleteMany({ teacherId });

    // Delete goals
    await Goal.deleteMany({ teacherId });

    // Delete classes
    await Class.deleteMany({ teacherId });

    // Note: Reports are generated dynamically, no need to delete

    // Finally delete the user account
    await User.findByIdAndDelete(teacherId);

    return NextResponse.json({ message: 'Hesap başarıyla silindi' });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ message: 'Sunucu hatası' }, { status: 500 });
  }
}
