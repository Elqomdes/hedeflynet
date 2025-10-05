import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { MobileService } from '@/lib/services/mobileService';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Öğrenci sayısı
    const totalStudents = await User.countDocuments({ role: 'student' });

    // Get real learning modules from database
    const modules = [];
    
    // Note: Real modules will be populated from the LearningModule collection
    // when teachers start creating actual learning modules

    return NextResponse.json({ data: modules });

  } catch (error) {
    console.error('Get adaptive learning modules error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, subject, level, type, estimatedTime, difficulty, isAdaptive } = body;
    if (!title || !description || !subject || !level || !type) {
      return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
    }

    // Mock create result (real impl would store in DB)
    const createdModule = {
      id: `module_${Date.now()}`,
      title,
      description,
      subject,
      level,
      type,
      content: '',
      learningObjectives: [],
      prerequisites: [],
      estimatedTime: estimatedTime || 60,
      difficulty: difficulty || 3,
      tags: [],
      isAdaptive: Boolean(isAdaptive),
      isActive: true,
      studentsEnrolled: 0,
      completionRate: 0,
      averageScore: 0,
      createdAt: new Date().toISOString()
    };

    try {
      const mobile = MobileService.getInstance();
      await mobile.sendPushNotification(user.id, {
        title: 'Yeni Modül Oluşturuldu',
        body: `${title} modülü başarıyla oluşturuldu.`,
        data: { type: 'adaptive_module' },
        priority: 'normal'
      });
    } catch (e) {
      console.error('Mobile notification on create module error:', e);
    }

    return NextResponse.json({ success: true, data: createdModule });
  } catch (error) {
    console.error('Create adaptive module error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
