import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
    const { Parent } = await import('@/lib/models/Parent');
    const parent = await Parent.findById(parentId);
    if (!parent) {
      return NextResponse.json(
        { error: 'Veli bulunamadı' },
        { status: 404 }
      );
    }

    // Delete parent
    await Parent.findByIdAndDelete(parentId);

    return NextResponse.json({
      success: true,
      message: 'Veli başarıyla silindi'
    });

  } catch (error) {
    console.error('Delete parent error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const connection = await connectDB();
    if (!connection) {
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı' },
        { status: 500 }
      );
    }

    const parentId = params.id;

    // Get parent details
    const { Parent } = await import('@/lib/models/Parent');
    const parent = await Parent.findById(parentId)
      .select('_id email firstName lastName phone children isActive createdAt')
      .populate('children', 'firstName lastName email');

    if (!parent) {
      return NextResponse.json(
        { error: 'Veli bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      parent: parent
    });

  } catch (error) {
    console.error('Get parent error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
