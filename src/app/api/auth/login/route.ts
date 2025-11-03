import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { IUser } from '@/lib/models/User';
import { Parent, IParent } from '@/lib/models/Parent';
import { generateToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';
import { safeIdToString } from '@/lib/utils/idHelper';

export const dynamic = 'force-dynamic';

const LoginSchema = z.object({
  username: z.string().min(3).max(100),
  password: z.string().min(6).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Geçersiz giriş verileri', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { username, password } = parsed.data;
    const sanitizedUsername = username.trim();
    const sanitizedPassword = password;

    const rl = await rateLimit(request, { max: 5, windowMs: 15 * 60 * 1000, keyPrefix: 'login' });
    if (rl.limited) {
      return NextResponse.json(
        { error: 'Çok fazla başarısız giriş denemesi. Bir süre sonra tekrar deneyin.' },
        { status: 429 }
      );
    }

    await connectDB();
    
    // Check both User and Parent models
    const [user, parent] = await Promise.all([
      User.findOne({ 
        $or: [
          { username: sanitizedUsername },
          { email: sanitizedUsername }
        ],
        isActive: true 
      }),
      Parent.findOne({ 
        $or: [
          { username: sanitizedUsername },
          { email: sanitizedUsername }
        ],
        isActive: true 
      })
    ]);

    // Timing attack protection - always perform password comparison
    let isPasswordValid = false;
    let authenticatedUser = null;
    let userRole = '';

    if (user) {
      isPasswordValid = await user.comparePassword(sanitizedPassword);
      if (isPasswordValid) {
        authenticatedUser = user;
        userRole = user.role;
      }
    } else if (parent) {
      isPasswordValid = await parent.comparePassword(sanitizedPassword);
      if (isPasswordValid) {
        authenticatedUser = parent;
        userRole = 'parent';
      }
    }

    if (!isPasswordValid || !authenticatedUser) {
      // Dummy password comparison to prevent timing attacks
      const dummyUser = new User({ password: '$2a$10$dummy.hash.for.timing.attack.protection' });
      await dummyUser.comparePassword('dummy_password');
      
      return NextResponse.json(
        { error: 'Geçersiz kullanıcı adı veya şifre' },
        { status: 401 }
      );
    }

    // Generate appropriate token based on user type
    let token;
    let cookieName;
    
    if (userRole === 'parent') {
      if (!parent!._id) {
        return NextResponse.json(
          { error: 'Kullanıcı verisi eksik' },
          { status: 500 }
        );
      }
      token = generateToken(safeIdToString(parent!._id), parent!.username, 'parent');
      cookieName = 'parent-token';
    } else {
      if (!user!._id) {
        return NextResponse.json(
          { error: 'Kullanıcı verisi eksik' },
          { status: 500 }
        );
      }
      token = generateToken(safeIdToString(user!._id), user!.username, userRole);
      cookieName = 'auth-token';
    }

    if (!authenticatedUser._id) {
      return NextResponse.json(
        { error: 'Kullanıcı verisi eksik' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      message: 'Giriş başarılı',
      user: {
        id: safeIdToString(authenticatedUser._id),
        username: authenticatedUser.username,
        email: authenticatedUser.email,
        role: userRole,
        firstName: authenticatedUser.firstName,
        lastName: authenticatedUser.lastName
      }
    });

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days (in seconds)
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
