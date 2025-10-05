import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { AIRecommendation } from '@/lib/models';

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

    await connectDB();

    // AI önerisini bul ve güncelle
    const recommendation = await AIRecommendation.findById(id);
    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    // Durumu güncelle
    const newStatus = action === 'apply' ? 'applied' : 'dismissed';
    recommendation.status = newStatus;
    
    if (action === 'apply') {
      recommendation.appliedAt = new Date();
    } else {
      recommendation.dismissedAt = new Date();
    }

    await recommendation.save();

    return NextResponse.json({ 
      success: true, 
      message: `Öneri ${action === 'apply' ? 'uygulandı' : 'reddedildi'}`,
      status: newStatus,
      data: {
        id: recommendation._id,
        status: recommendation.status,
        appliedAt: recommendation.appliedAt,
        dismissedAt: recommendation.dismissedAt
      }
    });

  } catch (error) {
    console.error('Update AI recommendation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
