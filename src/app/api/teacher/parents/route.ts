import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const ParentCreateSchema = z.object({
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
  firstName: z.string().min(1, 'Ad gereklidir'),
  lastName: z.string().min(1, 'Soyad gereklidir'),
  phone: z.string().optional(),
  children: z.array(z.string()).default([])
});

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const connection = await connectDB();
    if (!connection) {
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı' },
        { status: 500 }
      );
    }

    // Get all parents
    const parents = await User.find({ role: 'parent' })
      .select('_id username email firstName lastName phone children isActive createdAt')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      parents: parents
    });

  } catch (error) {
    console.error('Get parents error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authResult = await getCurrentUser(request);
    if (!authResult || authResult.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request data
    const body = await request.json();
    const parsed = ParentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Geçersiz giriş verileri', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { username, email, password, firstName, lastName, phone, children } = parsed.data;

    // Connect to MongoDB
    const connection = await connectDB();
    if (!connection) {
      return NextResponse.json(
        { error: 'Veritabanı bağlantısı kurulamadı' },
        { status: 500 }
      );
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create and save parent
    const parent = new User({
      username,
      email,
      password: hashedPassword,
      role: 'parent',
      firstName,
      lastName,
      phone: phone || '',
      children: children || [],
      isActive: true
    });

    await parent.save();

    return NextResponse.json({
      success: true,
      message: 'Veli başarıyla oluşturuldu',
      parent: {
        id: parent._id,
        username: parent.username,
        email: parent.email,
        firstName: parent.firstName,
        lastName: parent.lastName,
        role: parent.role
      }
    });

  } catch (error) {
    console.error('Create parent error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
