import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Class, User } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import { ClassCreateSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';

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
    logger.error('Teacher classes fetch error', { error });
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.apiRequest('POST', '/api/teacher/classes');
    
    // Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      logger.authEvent('Authentication failed for class creation');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.authEvent('Authentication successful for class creation');
    
    // Parse and validate request data
    const body = await request.json();
    const parsed = ClassCreateSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn('Class creation validation failed', { errors: parsed.error.flatten() });
      return NextResponse.json(
        { error: 'Geçersiz giriş verileri', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, description, coTeacherIds, studentIds } = parsed.data;

    logger.debug('Class creation validation passed, connecting to MongoDB');
    
    // Connect to MongoDB with better error handling
    const connection = await connectDB();
    if (!connection) {
      logger.error('MongoDB connection failed for class creation');
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı' },
        { status: 500 }
      );
    }
    logger.debug('MongoDB connected successfully for class creation');

    // Check for existing class
    logger.dbOperation('findOne', 'classes', { query: { name, teacherId: authResult._id } });
    const existingClass = await Class.findOne({
      name,
      teacherId: authResult._id
    });

    if (existingClass) {
      logger.warn('Class already exists with this name', { className: name, teacherId: authResult._id });
      return NextResponse.json(
        { error: 'Bu isimde zaten bir sınıf mevcut' },
        { status: 400 }
      );
    }

    logger.debug('No existing class found, creating new class');
    
    // Create and save class
    const classData = new Class({
      name,
      description,
      teacherId: authResult._id,
      coTeachers: coTeacherIds || [],
      students: studentIds || []
    });

    logger.dbOperation('save', 'classes', { classId: classData._id });
    await classData.save();
    logger.info('Class saved successfully', { classId: classData._id });

    // Populate the created class
    logger.debug('Populating class data');
    const populatedClass = await Class.findById(classData._id)
      .populate('teacherId', 'firstName lastName')
      .populate('coTeachers', 'firstName lastName')
      .populate('students', 'firstName lastName');

    logger.info('Class creation completed successfully', { classId: classData._id });
    return NextResponse.json(populatedClass, { status: 201 });
  } catch (error) {
    logger.error('Create class error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
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
