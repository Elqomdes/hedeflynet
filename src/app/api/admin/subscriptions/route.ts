import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Subscription, User } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get all subscriptions with teacher information
    const subscriptions = await Subscription.find()
      .populate('teacherId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      subscriptions
    });
  } catch (error) {
    console.error('Admin subscriptions fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Abonelikler alınamadı' },
      { status: 500 }
    );
  }
}
