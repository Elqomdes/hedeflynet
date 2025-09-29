import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isActive } = await request.json();
    await connectDB();

    const teacher = await User.findById(params.id);
    if (!teacher) {
      return NextResponse.json(
        { error: 'Öğretmen bulunamadı' },
        { status: 404 }
      );
    }

    if (teacher.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Bu kullanıcı öğretmen değil' },
        { status: 400 }
      );
    }

    teacher.isActive = isActive;
    await teacher.save();

    return NextResponse.json({
      message: `Öğretmen ${isActive ? 'aktif' : 'pasif'} hale getirildi`,
      isActive: teacher.isActive
    });
  } catch (error) {
    console.error('Toggle teacher status error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
