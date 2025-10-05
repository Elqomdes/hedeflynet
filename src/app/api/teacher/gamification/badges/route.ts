import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { GamificationService } from '@/lib/services/gamificationService';

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

    const gamificationService = GamificationService.getInstance();
    
    // Get real badges from database
    const badges = await gamificationService.getAllAchievements();

    return NextResponse.json({ data: badges });

  } catch (error) {
    console.error('Get gamification badges error:', error);
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
    const { name, description, category, points, badgeIcon } = body;

    if (!name || !description || !category || !points) {
      return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
    }

    await connectDB();

    const gamificationService = GamificationService.getInstance();
    
    // Create new achievement using real service
    const newBadge = await gamificationService.createAchievement({
      name,
      description,
      icon: badgeIcon || '🏆',
      category,
      points: parseInt(points),
      requirements: { type: 'manual', value: 1 } // Default requirement
    });

    return NextResponse.json({ success: true, data: newBadge });
  } catch (error) {
    console.error('Create gamification badge error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}