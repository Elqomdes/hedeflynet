import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
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

    const { id } = params;

    // Simüle edilmiş meeting URL'i
    const meetingUrl = `https://meet.google.com/${id}-${Math.random().toString(36).substr(2, 6)}`;

    return NextResponse.json({ 
      success: true, 
      meetingUrl,
      message: 'Oturuma katılım başarılı'
    });

  } catch (error) {
    console.error('Join video session error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
