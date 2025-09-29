'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Users, Target, BarChart3, BookOpen, CheckCircle } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  firstName: string;
  lastName: string;
  phone?: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(2);
  const router = useRouter();

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const checkAuth = async () => {
      try {
        console.log('Checking auth...');
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });

        console.log('Auth response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Auth data:', data);
          
          if (data.user) {
            setUser(data.user);
            console.log('User found, starting countdown...');
            
            // Start countdown and auto-redirect
            countdownInterval = setInterval(() => {
              setCountdown(prev => {
                console.log('Countdown:', prev);
                if (prev <= 1) {
                  if (countdownInterval) clearInterval(countdownInterval);
                  console.log('Redirecting to:', data.user.role);
                  switch (data.user.role) {
                    case 'admin':
                      router.push('/admin');
                      break;
                    case 'teacher':
                      router.push('/ogretmen');
                      break;
                    case 'student':
                      router.push('/ogrenci');
                      break;
                    default:
                      console.log('Unknown role, staying on homepage');
                      break;
                  }
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          } else {
            console.log('No user data found');
            setUser(null);
          }
        } else {
          console.log('Auth failed, user not logged in');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    checkAuth();

    // Fallback timeout - if auth check takes too long, show homepage
    timeoutId = setTimeout(() => {
      console.log('Auth check timeout, showing homepage');
      setLoading(false);
      setUser(null);
    }, 5000); // 5 second timeout

    // Cleanup function
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [router]);


  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary-600">Yönlendiriliyor...</p>
          <button
            onClick={() => {
              setLoading(false);
              setUser(null);
            }}
            className="mt-4 text-sm text-primary-600 hover:text-primary-500 underline"
          >
            Beklemek istemiyorum
          </button>
        </div>
      </div>
    );
  }
  // If user is logged in, show personalized content
  if (user) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
              Hoş geldin, {user.firstName}! 👋
            </h1>
            <p className="text-xl text-secondary-700 mb-8">
              {user.role === 'admin' && 'Yönetici paneline yönlendiriliyorsunuz...'}
              {user.role === 'teacher' && 'Öğretmen paneline yönlendiriliyorsunuz...'}
              {user.role === 'student' && 'Öğrenci paneline yönlendiriliyorsunuz...'}
            </p>
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-primary-100 rounded-full">
                <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse mr-3"></div>
                <span className="text-primary-700 font-medium">
                  {countdown} saniye sonra yönlendirileceksiniz
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  switch (user.role) {
                    case 'admin':
                      router.push('/admin');
                      break;
                    case 'teacher':
                      router.push('/ogretmen');
                      break;
                    case 'student':
                      router.push('/ogrenci');
                      break;
                  }
                }}
                className="btn-primary text-lg px-8 py-3 inline-flex items-center justify-center"
              >
                {user.role === 'admin' && 'Yönetici Paneli'}
                {user.role === 'teacher' && 'Öğretmen Paneli'}
                {user.role === 'student' && 'Öğrenci Paneli'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    router.push('/');
                  } catch (error) {
                    console.error('Logout failed:', error);
                    router.push('/');
                  }
                }}
                className="btn-outline text-lg px-8 py-3"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is not logged in, show public homepage
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 mb-6">
              Hedefly
            </h1>
            <p className="text-xl md:text-2xl text-secondary-700 mb-8 max-w-3xl mx-auto">
              Modern öğrenci koçluk platformu ile öğrencilerinizin hedeflerine ulaşmasına yardımcı olun
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/giris" className="btn-primary text-lg px-8 py-3">
                Hemen Başla
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </Link>
              <Link href="/iletisim" className="btn-outline text-lg px-8 py-3">
                İletişime Geç
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Neden Hedefly?
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Öğrenci koçluğunuzu dijitalleştirin ve daha etkili sonuçlar alın
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                Öğrenci Yönetimi
              </h3>
              <p className="text-secondary-600">
                Öğrencilerinizi kolayca ekleyin, sınıflar oluşturun ve bireysel koçluk yapın.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                Ödev Sistemi
              </h3>
              <p className="text-secondary-600">
                PDF, video ve link ile ödevler verin, takip edin ve değerlendirin.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                Hedef Belirleme
              </h3>
              <p className="text-secondary-600">
                Öğrencilerinize hedefler belirleyin ve ilerlemelerini takip edin.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                Detaylı Analiz
              </h3>
              <p className="text-secondary-600">
                Öğrenci performansını grafiklerle analiz edin ve raporlar oluşturun.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                Planlama
              </h3>
              <p className="text-secondary-600">
                Günlük, haftalık ve aylık planlar oluşturun ve takip edin.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                Ko-Öğretmen Sistemi
              </h3>
              <p className="text-secondary-600">
                Maksimum 3 ko-öğretmen ekleyerek işbirliği yapın.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
            Hemen Başlayın
          </h2>
          <p className="text-xl text-secondary-700 mb-8 max-w-2xl mx-auto">
            Öğretmen başvurusu yapın ve öğrenci koçluğunuzu dijitalleştirin
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/iletisim" className="btn-primary text-lg px-8 py-3">
              Öğretmen Başvurusu Yap
            </Link>
            <Link href="/giris" className="btn-outline text-lg px-8 py-3">
              Giriş Yap
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
