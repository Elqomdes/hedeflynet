import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { generateToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

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
      return NextResponse.json(
        { error: 'Geçersiz kullanıcı adı veya şifre' },
        { status: 401 }
      );
    }

    // No need to clear rate limit; it expires automatically

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
      path: '/',
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
