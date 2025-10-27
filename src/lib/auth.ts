import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import connectDB from './mongodb';
import { User } from './models';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-for-development-only-change-in-production-32chars';

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET environment variable is not set. Using fallback secret. This is not secure for production!');
}

if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  parentId?: string;
  iat: number;
  exp: number;
}

export function generateToken(userId: string, username: string, role: string): string {
  return jwt.sign(
    { userId, username, role },
    JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET!) as JWTPayload;
    
    // Validate token structure
    if (!decoded.userId || !decoded.username || !decoded.role) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    // Log specific JWT errors for debugging
    if (error instanceof jwt.JsonWebTokenError) {
      console.warn('JWT verification failed:', error.message);
    } else if (error instanceof jwt.TokenExpiredError) {
      console.warn('JWT token expired');
    } else if (error instanceof jwt.NotBeforeError) {
      console.warn('JWT token not active');
    }
    return null;
  }
}

export async function getCurrentUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    await connectDB();
    const user = await User.findById(payload.userId).select('-password');
    
    if (!user || !user.isActive) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export function requireAuth(roles?: string[]) {
  return async (request: NextRequest) => {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return { error: 'Unauthorized', status: 401 };
    }

    if (roles && !roles.includes(user.role)) {
      return { error: 'Forbidden', status: 403 };
    }

    return { user };
  };
}

export async function getCurrentParent(request: NextRequest) {
  try {
    // First try to get from regular auth - check if user exists as parent
    const user = await getCurrentUser(request);
    if (user) {
      await connectDB();
      const { Parent } = await import('./models/Parent');
      const parent = await Parent.findOne({ 
        $or: [
          { username: user.username },
          { email: user.email }
        ],
        isActive: true 
      }).select('-password');
      
      if (parent) {
        return parent;
      }
    }

    // Alternative: check parent-token
    const token = request.cookies.get('parent-token')?.value;
    
    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    await connectDB();
    const { Parent } = await import('./models/Parent');
    const parent = await Parent.findById(payload.parentId || payload.userId).select('-password');
    
    if (!parent || !parent.isActive) {
      return null;
    }

    return parent;
  } catch (error) {
    console.error('Parent auth error:', error);
    return null;
  }
}
