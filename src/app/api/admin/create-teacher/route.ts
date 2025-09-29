import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting teacher creation process...');
    
    const authResult = await requireAuth(['admin'])(request);
    if ('error' in authResult) {
      console.log('Authentication failed for teacher creation:', authResult.error);
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    console.log('Authentication successful, parsing request data...');
    
    const { username, password, email, firstName, lastName, phone } = await request.json();

    // Input validation
    if (!username || !password || !email || !firstName || !lastName) {
      console.log('Validation failed: missing required fields');
      return NextResponse.json(
        { error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      console.log('Validation failed: password too short');
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    console.log('Validation passed, connecting to MongoDB...');
    
    await connectDB();
    console.log('MongoDB connected successfully');

    // Check if user already exists
    console.log('Checking for existing user...');
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      console.log('User already exists');
      return NextResponse.json(
        { error: 'Bu kullanıcı adı veya e-posta adresi zaten kullanılıyor' },
        { status: 400 }
      );
    }

    console.log('No existing user found, creating new teacher...');
    
    // Create teacher user
    const teacher = new User({
      username,
      email,
      password,
      role: 'teacher',
      firstName,
      lastName,
      phone: phone || '',
      isActive: true
    });

    console.log('Saving teacher to database...');
    await teacher.save();
    console.log('Teacher saved successfully with ID:', teacher._id);

    return NextResponse.json({
      message: 'Öğretmen başarıyla oluşturuldu',
      teacher: {
        id: teacher._id,
        username: teacher.username,
        email: teacher.email,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        role: teacher.role
      }
    });
  } catch (error) {
    console.error('Create teacher error:', error);
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

