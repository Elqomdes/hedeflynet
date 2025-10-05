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

    // Öğrencileri getir
    const students = await User.find({ role: 'student' }).lean();

    // Simüle edilmiş sosyal gönderiler
    const posts = [
      {
        id: 'post_1',
        title: 'Matematik Fonksiyonlar Konusunda Yardım',
        content: 'Fonksiyonlar konusunda grafik çizerken zorlanıyorum. Hangi yöntemleri kullanabilirim?',
        author: students[0] ? `${students[0].firstName} ${students[0].lastName}` : 'Ahmet Yılmaz',
        authorId: students[0]?._id.toString() || 'student_1',
        type: 'question',
        subject: 'Matematik',
        likes: 5,
        comments: 3,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 saat önce
        tags: ['fonksiyonlar', 'grafik', 'matematik']
      },
      {
        id: 'post_2',
        title: 'Fizik Hareket Problemleri Çözüm Teknikleri',
        content: 'Hareket problemlerini çözerken kullandığım teknikleri paylaşmak istiyorum. Formül ezberlemek yerine mantığını anlamak daha etkili.',
        author: students[1] ? `${students[1].firstName} ${students[1].lastName}` : 'Ayşe Demir',
        authorId: students[1]?._id.toString() || 'student_2',
        type: 'discussion',
        subject: 'Fizik',
        likes: 12,
        comments: 7,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 saat önce
        tags: ['hareket', 'fizik', 'problem çözme']
      },
      {
        id: 'post_3',
        title: 'Kimya Periyodik Tablo Kaynakları',
        content: 'Periyodik tabloyu öğrenmek için kullandığım faydalı kaynakları paylaşıyorum. Bu linkler çok işime yaradı.',
        author: students[2] ? `${students[2].firstName} ${students[2].lastName}` : 'Mehmet Kaya',
        authorId: students[2]?._id.toString() || 'student_3',
        type: 'resource',
        subject: 'Kimya',
        likes: 8,
        comments: 4,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 saat önce
        tags: ['periyodik tablo', 'kimya', 'kaynak']
      },
      {
        id: 'post_4',
        title: 'Biyoloji Hücre Organelleri',
        content: 'Hücre organellerinin işlevlerini hatırlamak için bir şarkı yazdım. Paylaşmak istiyorum!',
        author: students[3] ? `${students[3].firstName} ${students[3].lastName}` : 'Zeynep Özkan',
        authorId: students[3]?._id.toString() || 'student_4',
        type: 'discussion',
        subject: 'Biyoloji',
        likes: 15,
        comments: 9,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 saat önce
        tags: ['hücre', 'organel', 'biyoloji', 'şarkı']
      },
      {
        id: 'post_5',
        title: 'Tarih Osmanlı Dönemi Kronolojisi',
        content: 'Osmanlı dönemindeki önemli olayları kronolojik sırayla listeleyen bir çalışma kağıdı hazırladım.',
        author: students[4] ? `${students[4].firstName} ${students[4].lastName}` : 'Can Yıldız',
        authorId: students[4]?._id.toString() || 'student_5',
        type: 'resource',
        subject: 'Tarih',
        likes: 6,
        comments: 2,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 saat önce
        tags: ['osmanlı', 'tarih', 'kronoloji']
      },
      {
        id: 'post_6',
        title: 'Türkçe Kompozisyon Yazma İpuçları',
        content: 'Kompozisyon yazarken dikkat etmem gereken noktalar neler? Tecrübeli arkadaşların önerilerini bekliyorum.',
        author: students[5] ? `${students[5].firstName} ${students[5].lastName}` : 'Elif Arslan',
        authorId: students[5]?._id.toString() || 'student_6',
        type: 'question',
        subject: 'Türkçe',
        likes: 4,
        comments: 6,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 gün önce
        tags: ['kompozisyon', 'türkçe', 'yazma']
      }
    ];

    // Tarihe göre sırala (en yeni önce)
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ data: posts });

  } catch (error) {
    console.error('Get social learning posts error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
