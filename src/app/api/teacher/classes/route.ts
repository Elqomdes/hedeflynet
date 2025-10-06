import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Class, User } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import { ClassCreateSchema } from '@/lib/validation';

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

    const teacherId = authResult._id;

    // Get classes for this teacher (as main teacher or co-teacher)
    const classes = await Class.find({
      $or: [
        { teacherId },
        { coTeachers: teacherId }
      ]
    })
      .populate('teacherId', 'firstName lastName')
      .populate('coTeachers', 'firstName lastName')
      .populate('students', 'firstName lastName')
      .sort({ createdAt: -1 });

    return NextResponse.json(classes);
  } catch (error) {
    console.error('Teacher classes error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting class creation process...');
    
    // Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      console.log('Authentication failed for class creation');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Authentication successful, parsing request data...');
    
    // Parse and validate request data
    const body = await request.json();
    const parsed = ClassCreateSchema.safeParse(body);
    if (!parsed.success) {
      console.log('Validation failed:', parsed.error.flatten());
      return NextResponse.json(
        { error: 'Geçersiz giriş verileri', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, description, coTeacherIds, studentIds } = parsed.data;

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

    // Check for existing class
    console.log('Checking for existing class...');
    const existingClass = await Class.findOne({
      name,
      teacherId: authResult._id
    });

    if (existingClass) {
      console.log('Class already exists with this name');
      return NextResponse.json(
        { error: 'Bu isimde zaten bir sınıf mevcut' },
        { status: 400 }
      );
    }

    console.log('No existing class found, creating new class...');
    
    // Create and save class
    const classData = new Class({
      name,
      description,
      teacherId: authResult._id,
      coTeachers: coTeacherIds || [],
      students: studentIds || []
    });

    console.log('Saving class to database...');
    await classData.save();
    console.log('Class saved successfully with ID:', classData._id);

    // Populate the created class
    console.log('Populating class data...');
    const populatedClass = await Class.findById(classData._id)
      .populate('teacherId', 'firstName lastName')
      .populate('coTeachers', 'firstName lastName')
      .populate('students', 'firstName lastName');

    console.log('Class creation completed successfully');
    return NextResponse.json(populatedClass, { status: 201 });
  } catch (error) {
    console.error('Create class error:', error);
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
