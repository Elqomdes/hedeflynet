import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getCurrentParent } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { safeIdToString } from '@/lib/utils/idHelper';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Try to get parent first
    const parent = await getCurrentParent(request);
    if (parent) {
      if (!parent._id) {
        return NextResponse.json(
          { error: 'Kullanıcı verisi eksik' },
          { status: 500 }
        );
      }
      return NextResponse.json({
        user: {
          id: safeIdToString(parent._id),
          username: parent.username,
          email: parent.email,
          role: 'parent',
          firstName: parent.firstName,
          lastName: parent.lastName,
          phone: parent.phone || ''
        }
      });
    }
    
    // Try to get regular user
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    // Validate user data before sending
    if (!user._id || !user.username || !user.email || !user.role || !user.firstName || !user.lastName) {
      return NextResponse.json(
        { error: 'Kullanıcı verisi eksik' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        id: safeIdToString(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || ''
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
