import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';

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

    // Simüle edilmiş öğrenme modülleri
    const modules = [
      {
        id: 'module_1',
        title: 'Matematik - Fonksiyonlar',
        description: 'Fonksiyonlar konusunda temel kavramlar, grafik çizimi ve uygulamalar',
        subject: 'Matematik',
        level: 'intermediate',
        type: 'interactive',
        content: 'Fonksiyonlar modülü içeriği...',
        learningObjectives: [
          'Fonksiyon kavramını anlama',
          'Fonksiyon grafiklerini çizebilme',
          'Fonksiyon türlerini ayırt edebilme'
        ],
        prerequisites: ['Temel cebir bilgisi', 'Koordinat sistemi'],
        estimatedTime: 90,
        difficulty: 3,
        tags: ['fonksiyonlar', 'grafik', 'matematik'],
        isAdaptive: true,
        isActive: true,
        studentsEnrolled: Math.floor(totalStudents * 0.8),
        completionRate: 75,
        averageScore: 82,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'module_2',
        title: 'Fizik - Hareket',
        description: 'Hareket konusunda temel kavramlar ve problem çözme teknikleri',
        subject: 'Fizik',
        level: 'beginner',
        type: 'video',
        content: 'Hareket modülü içeriği...',
        learningObjectives: [
          'Hareket türlerini tanımlama',
          'Hız ve ivme hesaplama',
          'Problem çözme becerisi geliştirme'
        ],
        prerequisites: ['Temel matematik'],
        estimatedTime: 60,
        difficulty: 2,
        tags: ['hareket', 'hız', 'ivme'],
        isAdaptive: false,
        isActive: true,
        studentsEnrolled: Math.floor(totalStudents * 0.6),
        completionRate: 85,
        averageScore: 78,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'module_3',
        title: 'Kimya - Atom Yapısı',
        description: 'Atom yapısı ve periyodik tablo konuları',
        subject: 'Kimya',
        level: 'advanced',
        type: 'assessment',
        content: 'Atom yapısı modülü içeriği...',
        learningObjectives: [
          'Atom yapısını anlama',
          'Periyodik tabloyu kullanabilme',
          'Kimyasal bağları açıklayabilme'
        ],
        prerequisites: ['Temel kimya', 'Atom teorisi'],
        estimatedTime: 120,
        difficulty: 4,
        tags: ['atom', 'periyodik tablo', 'kimyasal bağ'],
        isAdaptive: true,
        isActive: true,
        studentsEnrolled: Math.floor(totalStudents * 0.4),
        completionRate: 65,
        averageScore: 88,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'module_4',
        title: 'Biyoloji - Hücre',
        description: 'Hücre yapısı ve organelleri',
        subject: 'Biyoloji',
        level: 'intermediate',
        type: 'project',
        content: 'Hücre modülü içeriği...',
        learningObjectives: [
          'Hücre yapısını tanımlama',
          'Organellerin işlevlerini açıklama',
          'Hücre türlerini karşılaştırma'
        ],
        prerequisites: ['Temel biyoloji'],
        estimatedTime: 75,
        difficulty: 3,
        tags: ['hücre', 'organel', 'biyoloji'],
        isAdaptive: false,
        isActive: true,
        studentsEnrolled: Math.floor(totalStudents * 0.7),
        completionRate: 90,
        averageScore: 85,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'module_5',
        title: 'Türkçe - Kompozisyon',
        description: 'Kompozisyon yazma teknikleri ve uygulamalar',
        subject: 'Türkçe',
        level: 'beginner',
        type: 'interactive',
        content: 'Kompozisyon modülü içeriği...',
        learningObjectives: [
          'Kompozisyon planı yapabilme',
          'Etkili paragraf yazabilme',
          'Dil bilgisi kurallarını uygulayabilme'
        ],
        prerequisites: ['Temel dil bilgisi'],
        estimatedTime: 45,
        difficulty: 2,
        tags: ['kompozisyon', 'yazma', 'dil bilgisi'],
        isAdaptive: true,
        isActive: false,
        studentsEnrolled: Math.floor(totalStudents * 0.3),
        completionRate: 70,
        averageScore: 76,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'module_6',
        title: 'Tarih - Osmanlı Dönemi',
        description: 'Osmanlı İmparatorluğu dönemi tarihi',
        subject: 'Tarih',
        level: 'intermediate',
        type: 'video',
        content: 'Osmanlı tarihi modülü içeriği...',
        learningObjectives: [
          'Osmanlı dönemini kronolojik sırayla anlama',
          'Önemli olayları analiz edebilme',
          'Tarihsel bağlantıları kurabilme'
        ],
        prerequisites: ['Temel tarih bilgisi'],
        estimatedTime: 100,
        difficulty: 3,
        tags: ['osmanlı', 'tarih', 'kronoloji'],
        isAdaptive: false,
        isActive: true,
        studentsEnrolled: Math.floor(totalStudents * 0.5),
        completionRate: 80,
        averageScore: 79,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    return NextResponse.json({ data: modules });

  } catch (error) {
    console.error('Get adaptive learning modules error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
