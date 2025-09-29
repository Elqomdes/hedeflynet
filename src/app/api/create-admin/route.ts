import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { User } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const adminSeedToken = process.env.ADMIN_SEED_TOKEN;
    const providedToken = request.headers.get('x-admin-seed-token') || new URL(request.url).searchParams.get('token');

    if (adminSeedToken && providedToken !== adminSeedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const username: string = body.username || 'admin';
    const password: string = body.password || 'admin123';
    const email: string = body.email || `${username}@hedefly.net`;
    const firstName: string = body.firstName || 'Admin';
    const lastName: string = body.lastName || 'User';
    const phone: string = body.phone || '';

    if (!username || !password || !email || !firstName || !lastName) {
      return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalıdır' }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return NextResponse.json({ message: 'Admin zaten mevcut', userId: existing._id }, { status: 200 });
    }

    const admin = new User({
      username,
      email,
      password,
      role: 'admin',
      firstName,
      lastName,
      phone,
      isActive: true
    });

    await admin.save();

    const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : undefined;
    const collectionName = (mongoose.connection.db && admin.collection) ? admin.collection.collectionName : 'users';

    return NextResponse.json({ 
      message: 'Admin başarıyla oluşturuldu', 
      userId: admin._id,
      database: dbName,
      collection: collectionName
    }, { status: 201 });
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu' }, { status: 500 });
  }
}


