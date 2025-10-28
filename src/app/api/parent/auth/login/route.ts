import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ParentService } from '@/lib/services/parentService';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-posta ve şifre gerekli' },
        { status: 400 }
      );
    }

    await connectDB();

    const parentService = ParentService.getInstance();
    const parent = await parentService.authenticateParent(email, password);

    if (!parent) {
      return NextResponse.json(
        { error: 'Geçersiz e-posta veya şifre' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        parentId: parent._id.toString(),
        email: parent.email,
        role: 'parent'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Set cookie
    const response = NextResponse.json({
      success: true,
      message: 'Giriş başarılı',
      parent: {
        id: parent._id.toString(),
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email,
        children: parent.children
      }
    });

    response.cookies.set('parent-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days (in seconds)
    });

    return response;

  } catch (error) {
    console.error('Parent login error:', error);
    return NextResponse.json(
      { 
        error: 'Giriş işlemi başarısız',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}
