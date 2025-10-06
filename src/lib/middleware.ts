import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './auth';

export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/iletisim', '/giris', '/rapor'];
  
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // API routes - let them handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/ogrenci', '/ogretmen', '/admin'];
  
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Lightweight SSR-side guard: if no cookie, redirect to login
    const token = request.cookies.get('auth-token');
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/giris';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Allow all other routes
  return NextResponse.next();
}
