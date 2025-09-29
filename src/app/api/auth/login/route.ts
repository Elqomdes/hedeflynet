import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { generateToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiting (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Input validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      );
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Geçersiz veri formatı' },
        { status: 400 }
      );
    }

    if (username.trim().length < 3) {
      return NextResponse.json(
        { error: 'Kullanıcı adı en az 3 karakter olmalıdır' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    if (username.length > 100) {
      return NextResponse.json(
        { error: 'Kullanıcı adı çok uzun' },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: 'Şifre çok uzun' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedUsername = username.trim();
    const sanitizedPassword = password;

    // Rate limiting check
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const attemptData = loginAttempts.get(clientIP);

    if (attemptData) {
      if (now - attemptData.lastAttempt < LOCKOUT_TIME) {
        if (attemptData.count >= MAX_ATTEMPTS) {
          return NextResponse.json(
            { error: 'Çok fazla başarısız giriş denemesi. 15 dakika sonra tekrar deneyin.' },
            { status: 429 }
          );
        }
      } else {
        // Reset attempts after lockout time
        loginAttempts.delete(clientIP);
      }
    }

    await connectDB();
    
    // Use sanitized inputs in query
    const user = await User.findOne({ 
      $or: [
        { username: sanitizedUsername },
        { email: sanitizedUsername }
      ],
      isActive: true 
    });

    // Timing attack protection - always perform password comparison
    let isPasswordValid = false;
    if (user) {
      isPasswordValid = await user.comparePassword(sanitizedPassword);
    } else {
      // Dummy password comparison to prevent timing attacks
      const dummyUser = new User({ password: '$2a$10$dummy.hash.for.timing.attack.protection' });
      await dummyUser.comparePassword('dummy_password');
    }

    if (!user || !isPasswordValid) {
      // Increment failed attempts
      const currentAttempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
      loginAttempts.set(clientIP, {
        count: currentAttempts.count + 1,
        lastAttempt: now
      });

      return NextResponse.json(
        { error: 'Geçersiz kullanıcı adı veya şifre' },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    loginAttempts.delete(clientIP);

    const token = generateToken((user._id as any).toString(), user.username, user.role);

    const response = NextResponse.json({
      message: 'Giriş başarılı',
      user: {
        id: (user._id as any).toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
