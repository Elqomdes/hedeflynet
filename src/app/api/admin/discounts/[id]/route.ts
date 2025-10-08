import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Discount } from '@/lib/models';
import mongoose from 'mongoose';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    const body = await request.json();
    const { name, description, discountPercentage, planTypes, startDate, endDate, maxUses } = body;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz indirim ID' },
        { status: 400 }
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
    
    // Update discount
    const discount = await Discount.findByIdAndUpdate(
      id,
      {
        name,
        description,
        discountPercentage,
        planTypes,
        startDate: start,
        endDate: end,
        maxUses: maxUses || undefined
      },
      { new: true }
    );
    
    if (!discount) {
      return NextResponse.json(
        { success: false, error: 'İndirim bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      discount
    });
  } catch (error) {
    console.error('Admin discount update error:', error);
    return NextResponse.json(
      { success: false, error: 'İndirim güncellenemedi' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz indirim ID' },
        { status: 400 }
      );
    }
    
    // Delete discount
    const discount = await Discount.findByIdAndDelete(id);
    
    if (!discount) {
      return NextResponse.json(
        { success: false, error: 'İndirim bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'İndirim başarıyla silindi'
    });
  } catch (error) {
    console.error('Admin discount delete error:', error);
    return NextResponse.json(
      { success: false, error: 'İndirim silinemedi' },
      { status: 500 }
    );
  }
}
