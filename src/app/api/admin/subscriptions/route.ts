import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Subscription, User } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin'])(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

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

const SetSubscriptionSchema = z.object({
  teacherId: z.string(),
  planType: z.enum(['3months', '6months', '12months']),
  startDate: z.string().optional(),
  isFreeTrial: z.boolean().optional(),
  originalPrice: z.number().optional(),
  discountedPrice: z.number().optional(),
  discountPercentage: z.number().min(0).max(100).optional()
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin'])(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    await connectDB();

    const json = await request.json();
    const parsed = SetSubscriptionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { teacherId, planType, startDate, isFreeTrial = false, originalPrice, discountedPrice, discountPercentage } = parsed.data;

    // Ensure teacher exists
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      return NextResponse.json(
        { error: 'Öğretmen bulunamadı' },
        { status: 404 }
      );
    }

    const start = startDate ? new Date(startDate) : new Date();

    const monthsMap: Record<'3months'|'6months'|'12months', number> = {
      '3months': 3,
      '6months': 6,
      '12months': 12
    };

    const end = new Date(start);
    end.setMonth(end.getMonth() + monthsMap[planType]);

    // Upsert subscription for teacher
    const existing = await Subscription.findOne({ teacherId: teacher._id, isActive: true }).sort({ createdAt: -1 });
    if (existing) {
      existing.planType = planType;
      existing.startDate = start;
      existing.endDate = end;
      existing.isFreeTrial = !!isFreeTrial;
      if (typeof originalPrice === 'number') existing.originalPrice = originalPrice;
      if (typeof discountedPrice === 'number') existing.discountedPrice = discountedPrice;
      if (typeof discountPercentage === 'number') existing.discountPercentage = discountPercentage;
      existing.paymentStatus = isFreeTrial ? 'paid' : existing.paymentStatus;
      existing.isActive = true;
      await existing.save();
    } else {
      await Subscription.create({
        teacherId: teacher._id,
        planType,
        startDate: start,
        endDate: end,
        isActive: true,
        isFreeTrial: !!isFreeTrial,
        originalPrice: typeof originalPrice === 'number' ? originalPrice : 0,
        discountedPrice,
        discountPercentage,
        paymentStatus: isFreeTrial ? 'paid' : 'pending'
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin set subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Abonelik ayarlanamadı' },
      { status: 500 }
    );
  }
}

const CancelSubscriptionSchema = z.object({
  subscriptionId: z.string()
});

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin'])(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    await connectDB();

    const json = await request.json();
    const parsed = CancelSubscriptionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { subscriptionId } = parsed.data;
    const sub = await Subscription.findById(subscriptionId);
    if (!sub) {
      return NextResponse.json(
        { error: 'Abonelik bulunamadı' },
        { status: 404 }
      );
    }

    sub.isActive = false;
    sub.endDate = new Date();
    await sub.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin cancel subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Abonelik iptal edilemedi' },
      { status: 500 }
    );
  }
}
