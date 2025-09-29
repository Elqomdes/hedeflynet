import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
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

    const students = await User.find({ role: 'student' })
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
    
    // Connect to MongoDB
    await connectDB();
    console.log('MongoDB connected successfully');

    // Check for existing user
    console.log('Checking for existing user...');
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

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
    await student.save();
    console.log('Student saved successfully with ID:', student._id);

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
