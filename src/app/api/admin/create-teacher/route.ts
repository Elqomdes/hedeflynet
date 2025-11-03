import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, FreeTeacherSlot, Subscription } from '@/lib/models';
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

    // Check if there are free teacher slots available and assign one
    console.log('Checking for available free teacher slots...');
    const usedSlots = await FreeTeacherSlot.countDocuments({ isActive: true });
    const TOTAL_SLOTS = 20;
    const isFreeTrial = usedSlots < TOTAL_SLOTS;
    let slotNumber = null;

    if (isFreeTrial) {
      console.log(`Free slot available. Assigning slot ${usedSlots + 1}...`);
      // Assign free teacher slot
      slotNumber = usedSlots + 1;
      const freeSlot = new FreeTeacherSlot({
        teacherId: teacher._id,
        slotNumber: slotNumber,
        isActive: true,
        assignedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      });
      await freeSlot.save();
      console.log('Free teacher slot assigned successfully');

      // Create free subscription
      console.log('Creating free subscription...');
      const freeSubscription = new Subscription({
        teacherId: teacher._id,
        planType: '12months', // Free trial is 12 months
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
        isFreeTrial: true,
        originalPrice: 0,
        paymentStatus: 'paid'
      });
      await freeSubscription.save();
      console.log('Free subscription created successfully');
    } else {
      console.log('No free slots available. Teacher will need a paid subscription.');
    }

    return NextResponse.json({
      message: isFreeTrial 
        ? 'Öğretmen başarıyla oluşturuldu ve ücretsiz deneme slotu atandı.'
        : 'Öğretmen başarıyla oluşturuldu. Abonelik gerekli.',
      teacher: {
        id: teacher._id,
        username: teacher.username,
        email: teacher.email,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        role: teacher.role
      },
      isFreeTrial,
      slotNumber: slotNumber
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

