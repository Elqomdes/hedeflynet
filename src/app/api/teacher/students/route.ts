import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Class } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import { apiCache } from '@/lib/cache';
import { StudentCreateSchema } from '@/lib/validation';
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

    const teacherId = authResult._id;
    const cacheKey = apiCache.generateKey('teacher-students', { teacherId });

    // Check cache first
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    await connectDB();

    // Get teacher's classes to find their students
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

    // If no students assigned to teacher's classes, return empty list
    if (studentIdSet.size === 0) {
      const emptyResult: any[] = [];
      apiCache.set(cacheKey, emptyResult, 2 * 60 * 1000); // Cache for 2 minutes
      return NextResponse.json(emptyResult);
    }

    const studentIds = Array.from(studentIdSet);

    const students = await User.find({
      role: 'student',
      _id: { $in: studentIds },
      isActive: true
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Cache the result for 2 minutes
    apiCache.set(cacheKey, students, 2 * 60 * 1000);

    return NextResponse.json(students);
  } catch (error) {
    logger.error('Students fetch error', { error });
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.apiRequest('POST', '/api/teacher/students');
    
    // Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      logger.authEvent('Authentication failed for student creation');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.authEvent('Authentication successful for student creation');
    
    // Parse and validate request data
    const body = await request.json();
    const parsed = StudentCreateSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn('Student creation validation failed', { errors: parsed.error.flatten() });
      return NextResponse.json(
        { error: 'Geçersiz giriş verileri', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { username, email, password, firstName, lastName, phone } = parsed.data;

    logger.debug('Student creation validation passed, connecting to MongoDB');
    
    // Connect to MongoDB with better error handling
    const connection = await connectDB();
    if (!connection) {
      logger.error('MongoDB connection failed for student creation');
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı' },
        { status: 500 }
      );
    }
    logger.debug('MongoDB connected successfully for student creation');

    // Check for existing user with better error handling
    logger.dbOperation('findOne', 'users', { query: { $or: [{ username }, { email }] } });
    let existingUser;
    try {
      existingUser = await User.findOne({
        $or: [{ username }, { email }]
      });
    } catch (dbError) {
      logger.error('Database query error during user lookup', { error: dbError });
      return NextResponse.json(
        { error: 'Veritabanı sorgu hatası' },
        { status: 500 }
      );
    }

    if (existingUser) {
      logger.warn('User already exists during student creation', { username, email });
      return NextResponse.json(
        { error: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor' },
        { status: 400 }
      );
    }

    logger.debug('No existing user found, creating new student');
    
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

    logger.dbOperation('save', 'users', { studentId: student._id });
    try {
      await student.save();
      logger.info('Student saved successfully', { studentId: student._id });
    } catch (saveError) {
      logger.error('Student save error', { error: saveError, studentId: student._id });
      return NextResponse.json(
        { error: 'Öğrenci kaydedilemedi' },
        { status: 500 }
      );
    }

    // Add student to teacher's default class or first available class
    try {
      logger.debug('Adding student to teacher\'s class');
      const teacherId = authResult._id;
      
      // Find teacher's first class or create a default one
      let teacherClass = await Class.findOne({
        $or: [
          { teacherId },
          { coTeachers: teacherId }
        ]
      });

      if (!teacherClass) {
        // Create a default class for the teacher
        logger.debug('Creating default class for teacher');
        teacherClass = new Class({
          name: `${authResult.firstName} ${authResult.lastName} - Varsayılan Sınıf`,
          description: 'Öğretmen tarafından oluşturulan varsayılan sınıf',
          teacherId: teacherId,
          students: [student._id as any]
        });
        await teacherClass.save();
        logger.info('Default class created', { classId: teacherClass._id });
      } else {
        // Add student to existing class
        if (!teacherClass.students.includes(student._id as any)) {
          teacherClass.students.push(student._id as any);
          await teacherClass.save();
          logger.info('Student added to existing class', { classId: teacherClass._id, studentId: student._id });
        }
      }
    } catch (classError) {
      logger.error('Error adding student to class', { error: classError, studentId: student._id });
      // Don't fail the student creation if class assignment fails
      logger.warn('Student created but class assignment failed', { studentId: student._id });
    }

    return NextResponse.json({
      message: 'Öğrenci başarıyla eklendi ve sınıfa atandı',
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
    logger.error('Add student error', { 
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
