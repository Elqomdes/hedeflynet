import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Class } from '@/lib/models';
import { getCurrentUser } from '@/lib/auth';
import { apiCache } from '@/lib/cache';

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

    // Add student to teacher's default class or first available class
    try {
      console.log('Adding student to teacher\'s class...');
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
        console.log('Creating default class for teacher...');
        teacherClass = new Class({
          name: `${authResult.firstName} ${authResult.lastName} - Varsayılan Sınıf`,
          description: 'Öğretmen tarafından oluşturulan varsayılan sınıf',
          teacherId: teacherId,
          students: [student._id as any]
        });
        await teacherClass.save();
        console.log('Default class created with ID:', teacherClass._id);
      } else {
        // Add student to existing class
        if (!teacherClass.students.includes(student._id as any)) {
          teacherClass.students.push(student._id as any);
          await teacherClass.save();
          console.log('Student added to existing class:', teacherClass._id);
        }
      }
    } catch (classError) {
      console.error('Error adding student to class:', classError);
      // Don't fail the student creation if class assignment fails
      console.log('Student created but class assignment failed');
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
