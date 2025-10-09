import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Discount } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Base pricing
    const basePricing: Record<string, { price: number; originalPrice: number; discountPercentage?: number; discountName?: string }> = {
      '3months': { price: 1500, originalPrice: 1500 },
      '6months': { price: 2400, originalPrice: 2400 },
      '12months': { price: 3600, originalPrice: 3600 }
    };

    // Get active discounts
    const now = new Date();
    const activeDiscounts = await Discount.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    // Apply discounts to pricing
    const pricing = { ...basePricing };
    
    activeDiscounts.forEach(discount => {
      discount.planTypes.forEach(planType => {
        if (pricing[planType]) {
          const discountAmount = (pricing[planType].originalPrice * discount.discountPercentage) / 100;
          pricing[planType].price = Math.round(pricing[planType].originalPrice - discountAmount);
          pricing[planType].discountPercentage = discount.discountPercentage;
          pricing[planType].discountName = discount.name;
        }
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        plans: [
          {
            id: '3months',
            name: '3 Aylık',
            duration: '3 ay',
            price: pricing['3months'].price,
            originalPrice: pricing['3months'].originalPrice,
            discountPercentage: pricing['3months'].discountPercentage,
            discountName: pricing['3months'].discountName,
            features: [
              'Sınırsız öğrenci ekleme',
              'Gelişmiş ödev sistemi',
              'Detaylı analiz ve raporlar',
              'Veli portalı erişimi',
              'Video koçluk oturumları',
              'Öncelikli destek'
            ],
            popular: false
          },
          {
            id: '6months',
            name: '6 Aylık',
            duration: '6 ay',
            price: pricing['6months'].price,
            originalPrice: pricing['6months'].originalPrice,
            discountPercentage: pricing['6months'].discountPercentage,
            discountName: pricing['6months'].discountName,
            features: [
              'Sınırsız öğrenci ekleme',
              'Gelişmiş ödev sistemi',
              'Detaylı analiz ve raporlar',
              'Veli portalı erişimi',
              'Video koçluk oturumları',
              'Öncelikli destek'
            ],
            popular: true
          },
          {
            id: '12months',
            name: '12 Aylık',
            duration: '12 ay',
            price: pricing['12months'].price,
            originalPrice: pricing['12months'].originalPrice,
            discountPercentage: pricing['12months'].discountPercentage,
            discountName: pricing['12months'].discountName,
            features: [
              'Sınırsız öğrenci ekleme',
              'Gelişmiş ödev sistemi',
              'Detaylı analiz ve raporlar',
              'Veli portalı erişimi',
              'Video koçluk oturumları',
              'Öncelikli destek'
            ],
            popular: false
          }
        ],
        activeDiscounts: activeDiscounts.map(discount => ({
          id: discount._id,
          name: discount.name,
          description: discount.description,
          discountPercentage: discount.discountPercentage,
          endDate: discount.endDate
        }))
      }
    });
  } catch (error) {
    console.error('Pricing fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Fiyatlandırma bilgileri alınamadı' },
      { status: 500 }
    );
  }
}
