import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Class } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Collect all student ids that belong to classes of this teacher
    const teacherId = authResult._id;

    const classes = await Class.find({
      $or: [
        { teacherId },
        { coTeachers: teacherId }
      ]
    }).select('students').lean();

    const studentIdSet = new Set<string>();
    for (const cls of classes) {
      if (Array.isArray((cls as any).students)) {
        for (const sid of (cls as any).students) {
          studentIdSet.add(String(sid));
        }
      }
    }

    // If no students assigned, return empty list
    if (studentIdSet.size === 0) {
      return NextResponse.json([]);
    }

    const studentIds = Array.from(studentIdSet);

    const students = await User.find({
      role: 'student',
      _id: { $in: studentIds }
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(students);
  } catch (error) {
    console.error('Students fetch error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting student creation process...');
    
    // Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      console.log('Authentication failed for student creation');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Authentication successful, parsing request data...');
    
    // Parse request data
    const { username, email, password, firstName, lastName, phone } = await request.json();

    // Validation
    if (!username || !email || !password || !firstName || !lastName) {
      console.log('Validation failed: missing required fields');
      return NextResponse.json(
        { error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    console.log('Validation passed, connecting to MongoDB...');
    
    // Connect to MongoDB with better error handling
    const connection = await connectDB();
    if (!connection) {
      console.error('MongoDB connection failed');
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı' },
        { status: 500 }
      );
    }
    console.log('MongoDB connected successfully');

    // Check for existing user with better error handling
    console.log('Checking for existing user...');
    let existingUser;
    try {
      existingUser = await User.findOne({
        $or: [{ username }, { email }]
      });
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        { error: 'Veritabanı sorgu hatası' },
        { status: 500 }
      );
    }

    if (existingUser) {
      console.log('User already exists');
      return NextResponse.json(
        { error: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor' },
        { status: 400 }
      );
    }

    console.log('No existing user found, creating new student...');
    
    // Create and save student
    const student = new User({
      username,
      email,
      password,
      role: 'student',
      firstName,
      lastName,
      phone: phone || '',
      isActive: true
    });

    console.log('Saving student to database...');
    try {
      await student.save();
      console.log('Student saved successfully with ID:', student._id);
    } catch (saveError) {
      console.error('Student save error:', saveError);
      return NextResponse.json(
        { error: 'Öğrenci kaydedilemedi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Öğrenci başarıyla eklendi',
      student: {
        id: student._id,
        username: student.username,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone
      }
    });
  } catch (error) {
    console.error('Add student error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Sunucu hatası',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}
