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
    // For protected routes, we'll let the layout components handle auth
    // but we need to ensure the route exists
    return NextResponse.next();
  }

  // Allow all other routes
  return NextResponse.next();
}
