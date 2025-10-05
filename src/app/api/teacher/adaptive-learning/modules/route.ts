import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User, LearningModule, ILearningModule } from '@/lib/models';
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
    const modules: ILearningModule[] = await LearningModule.find({ 
      createdBy: user.id,
      isActive: true 
    })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

    return NextResponse.json({ 
      data: modules,
      totalStudents,
      totalModules: modules.length 
    });

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

    await connectDB();

    const body = await request.json();
    const { title, description, subject, level, type, estimatedTime, difficulty, isAdaptive } = body;
    
    // Validation
    if (!title || !description || !subject || !level || !type) {
      return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
    }

    // Create new learning module
    const newModule = new LearningModule({
      title,
      description,
      subject,
      level,
      type,
      content: {
        text: '',
        attachments: []
      },
      learningObjectives: [],
      prerequisites: [],
      estimatedTime: estimatedTime || 60,
      difficulty: difficulty || 3,
      tags: [],
      isAdaptive: Boolean(isAdaptive),
      adaptiveRules: [],
      assessment: {
        questions: [],
        passingScore: 70,
        attempts: 3
      },
      isActive: true,
      createdBy: user.id
    });

    const createdModule = await newModule.save();

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

    return NextResponse.json({ 
      success: true, 
      data: {
        id: createdModule._id,
        title: createdModule.title,
        description: createdModule.description,
        subject: createdModule.subject,
        level: createdModule.level,
        type: createdModule.type,
        estimatedTime: createdModule.estimatedTime,
        difficulty: createdModule.difficulty,
        isAdaptive: createdModule.isAdaptive,
        isActive: createdModule.isActive,
        createdAt: createdModule.createdAt
      }
    });
  } catch (error) {
    console.error('Create adaptive module error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
