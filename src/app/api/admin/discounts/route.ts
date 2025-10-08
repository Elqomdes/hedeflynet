import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Discount, User } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get all discounts with creator information
    const discounts = await Discount.find()
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      discounts
    });
  } catch (error) {
    console.error('Admin discounts fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'İndirimler alınamadı' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, description, discountPercentage, planTypes, startDate, endDate, maxUses } = body;
    
    // Get admin user from session (simplified for now)
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin kullanıcı bulunamadı' },
        { status: 404 }
      );
    }
    
    // Validate required fields
    if (!name || !description || !discountPercentage || !planTypes || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Tüm gerekli alanları doldurun' },
        { status: 400 }
      );
    }
    
    // Validate discount percentage
    if (discountPercentage < 1 || discountPercentage > 100) {
      return NextResponse.json(
        { success: false, error: 'İndirim yüzdesi 1-100 arasında olmalıdır' },
        { status: 400 }
      );
    }
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json(
        { success: false, error: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır' },
        { status: 400 }
      );
    }
    
    // Create discount
    const discount = new Discount({
      name,
      description,
      discountPercentage,
      planTypes,
      startDate: start,
      endDate: end,
      maxUses: maxUses || undefined,
      createdBy: adminUser._id
    });
    
    await discount.save();
    
    return NextResponse.json({
      success: true,
      discount
    });
  } catch (error) {
    console.error('Admin discount creation error:', error);
    return NextResponse.json(
      { success: false, error: 'İndirim oluşturulamadı' },
      { status: 500 }
    );
  }
}
