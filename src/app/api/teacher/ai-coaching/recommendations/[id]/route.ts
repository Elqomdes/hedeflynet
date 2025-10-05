import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action } = await request.json();
    const { id } = params;

    if (!action || !['apply', 'dismiss'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Burada gerçek uygulamada veritabanında öneriyi güncelleriz
    // Şimdilik sadece başarılı yanıt döndürüyoruz
    const newStatus = action === 'apply' ? 'applied' : 'dismissed';

    return NextResponse.json({ 
      success: true, 
      message: `Öneri ${action === 'apply' ? 'uygulandı' : 'reddedildi'}`,
      status: newStatus
    });

  } catch (error) {
    console.error('Update AI recommendation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
