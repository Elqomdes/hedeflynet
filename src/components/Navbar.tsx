'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, User, LogOut } from 'lucide-react';

export default function Navbar() {
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

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Ensure cookies are sent
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (isMounted && data.user) {
            setUser(data.user);
          }
        } else {
          // Clear user state on auth failure
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Refresh auth state every 5 minutes
    const interval = setInterval(() => {
      if (isMounted) {
        checkAuth();
      }
    }, 5 * 60 * 1000);

    // Cleanup function
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        setUser(null);
        router.push('/');
      } else {
        console.error('Logout failed:', await response.text());
        // Force logout even if API fails
        setUser(null);
        router.push('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API fails
      setUser(null);
      router.push('/');
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/giris';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'teacher': return '/ogretmen';
      case 'student': return '/ogrenci';
      default: return '/giris';
    }
  };

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
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              Hedefly
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-secondary-700 hover:text-primary-600 transition-colors">
              Ana Sayfa
            </Link>
            <Link href="/iletisim" className="text-secondary-700 hover:text-primary-600 transition-colors">
              İletişim
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-secondary-700">
                  Hoş geldin, {user.firstName}
                </span>
                <Link
                  href={getDashboardLink()}
                  className="btn-primary flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Panel</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-secondary-700 hover:text-primary-600 transition-colors flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Çıkış</span>
                </button>
              </div>
            ) : (
              <Link href="/giris" className="btn-primary">
                Giriş Yap
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-secondary-700 hover:text-primary-600 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link
                href="/"
                className="block px-3 py-2 text-secondary-700 hover:text-primary-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Ana Sayfa
              </Link>
              <Link
                href="/iletisim"
                className="block px-3 py-2 text-secondary-700 hover:text-primary-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                İletişim
              </Link>
              
              {user ? (
                <>
                  <Link
                    href={getDashboardLink()}
                    className="block px-3 py-2 text-secondary-700 hover:text-primary-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Panel
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-secondary-700 hover:text-primary-600 transition-colors"
                  >
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <Link
                  href="/giris"
                  className="block px-3 py-2 text-secondary-700 hover:text-primary-600 transition-colors"
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
