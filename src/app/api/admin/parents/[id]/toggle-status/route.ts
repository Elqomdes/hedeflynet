import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Parent } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const ToggleStatusSchema = z.object({
  isActive: z.boolean()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request data
    const body = await request.json();
    const parsed = ToggleStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Geçersiz giriş verileri', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { isActive } = parsed.data;

    // Connect to MongoDB
    const connection = await connectDB();
    if (!connection) {
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı' },
        { status: 500 }
      );
    }

    const parentId = params.id;

    // Check if parent exists
    const parent = await Parent.findById(parentId);
    if (!parent) {
      return NextResponse.json(
        { error: 'Veli bulunamadı' },
        { status: 404 }
      );
    }

    // Update parent status
    parent.isActive = isActive;
    await parent.save();

    return NextResponse.json({
      success: true,
      message: `Veli ${isActive ? 'aktif' : 'pasif'} yapıldı`,
      parent: {
        id: parent._id,
        isActive: parent.isActive
      }
    });

  } catch (error) {
    console.error('Toggle parent status error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
