import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // Test Parent model
    const { Parent } = await import('@/lib/models/Parent');
    
    // Get all parents
    const parents = await Parent.find({})
      .select('_id username email firstName lastName phone children isActive createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Get parent count
    const parentCount = await Parent.countDocuments();

    // Test User model for students
    const User = (await import('@/lib/models/User')).default;
    const students = await User.find({ role: 'student' })
      .select('_id firstName lastName email')
      .lean();

    return NextResponse.json({
      success: true,
      debug: {
        connection: 'MongoDB bağlantısı başarılı',
        parentCount,
        parents: parents.slice(0, 5), // İlk 5 veli
        studentCount: students.length,
        students: students.slice(0, 5), // İlk 5 öğrenci
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Debug parents error:', error);
    return NextResponse.json(
      { 
        error: 'Debug hatası',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
