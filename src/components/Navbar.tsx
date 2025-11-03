'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useDataFetching } from '@/hooks/useDataFetching';
import LoadingSpinner from '@/components/LoadingSpinner';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'teacher' | 'student';
    firstName: string;
    lastName: string;
    phone?: string;
  }

  const router = useRouter();

  // Use optimized data fetching for auth with periodic refresh
  const { 
    data: authData, 
    loading, 
    error: authError 
  } = useDataFetching<{ user: User }>('/api/auth/me', {
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const user = authData?.user || null;

  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        router.push('/');
      } else {
        console.error('Logout failed:', await response.text());
        // Force logout even if API fails
        router.push('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API fails
      router.push('/');
    }
  }, [router]);

  const getDashboardLink = useMemo(() => {
    if (!user) return '/giris';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'teacher': return '/ogretmen';
      case 'student': return '/ogrenci';
      default: return '/giris';
    }
  }, [user]);

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                Hedefly
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-soft border-b border-secondary-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent hover:from-primary-700 hover:to-primary-800 transition-all duration-300">
              Hedefly
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="nav-link text-base font-medium">
              Ana Sayfa
            </Link>
            <a href="#features" className="nav-link text-base font-medium hover:text-primary-600 transition-colors">
              Özellikler
            </a>
            <a href="#benefits" className="nav-link text-base font-medium hover:text-primary-600 transition-colors">
              Avantajlar
            </a>
            <a href="#roles" className="nav-link text-base font-medium hover:text-primary-600 transition-colors">
              Roller
            </a>
            <Link href="/iletisim" className="nav-link text-base font-medium">
              İletişim
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3 bg-secondary-50 px-4 py-2 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.firstName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-secondary-700 font-medium">
                    Hoş geldin, {user.firstName}
                  </span>
                </div>
                <Link
                  href={getDashboardLink}
                  className="btn-primary flex items-center space-x-2 btn-sm"
                >
                  <User className="w-4 h-4" />
                  <span>Panel</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-outline flex items-center space-x-2 btn-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Çıkış</span>
                </button>
              </div>
            ) : (
              <Link href="/giris" className="btn-primary btn-sm">
                Giriş Yap
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-secondary-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden animate-slide-up">
            <div className="px-4 pt-4 pb-6 space-y-3 bg-white/95 backdrop-blur-md border-t border-secondary-200 rounded-b-2xl shadow-soft">
              <Link
                href="/"
                className="block px-4 py-3 text-secondary-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-300 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Ana Sayfa
              </Link>
              <a
                href="#features"
                className="block px-4 py-3 text-secondary-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-300 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Özellikler
              </a>
              <a
                href="#benefits"
                className="block px-4 py-3 text-secondary-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-300 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Avantajlar
              </a>
              <a
                href="#roles"
                className="block px-4 py-3 text-secondary-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-300 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Roller
              </a>
              <Link
                href="/iletisim"
                className="block px-4 py-3 text-secondary-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-300 font-medium"
                onClick={() => setIsOpen(false)}
              >
                İletişim
              </Link>
              
              {user ? (
                <>
                  <div className="px-4 py-3 bg-secondary-50 rounded-xl">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {user.firstName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-secondary-900">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-secondary-600">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      href={getDashboardLink}
                      className="block w-full btn-primary text-center mb-3"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="w-4 h-4 inline mr-2" />
                      Panel
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="block w-full btn-outline text-center"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Çıkış Yap
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  href="/giris"
                  className="block w-full btn-primary text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Giriş Yap
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default memo(Navbar);
