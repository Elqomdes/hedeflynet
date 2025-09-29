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
  const router = useRouter();

  useEffect(() => {
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
            console.log('User found, staying on homepage');
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
  }, []);


  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary-600">Yükleniyor...</p>
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
              Dashboard'unuza erişmek için aşağıdaki butonlardan birini seçin
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
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

            {/* Dashboard quick access cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {user.role === 'admin' && (
                <>
                  <div className="card text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin')}>
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">Yönetici Paneli</h3>
                    <p className="text-secondary-600 text-sm">Sistem yönetimi ve genel bakış</p>
                  </div>
                  <div className="card text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/ogretmenler')}>
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">Öğretmenler</h3>
                    <p className="text-secondary-600 text-sm">Öğretmen yönetimi</p>
                  </div>
                  <div className="card text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/istekler')}>
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">Başvurular</h3>
                    <p className="text-secondary-600 text-sm">Öğretmen başvuruları</p>
                  </div>
                </>
              )}
              
              {user.role === 'teacher' && (
                <>
                  <div className="card text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/ogretmen')}>
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">Öğretmen Paneli</h3>
                    <p className="text-secondary-600 text-sm">Ana dashboard</p>
                  </div>
                  <div className="card text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/ogretmen/ogrenciler')}>
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">Öğrencilerim</h3>
                    <p className="text-secondary-600 text-sm">Öğrenci yönetimi</p>
                  </div>
                  <div className="card text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/ogretmen/odevler')}>
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">Ödevler</h3>
                    <p className="text-secondary-600 text-sm">Ödev yönetimi</p>
                  </div>
                </>
              )}
              
              {user.role === 'student' && (
                <>
                  <div className="card text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/ogrenci')}>
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">Öğrenci Paneli</h3>
                    <p className="text-secondary-600 text-sm">Ana dashboard</p>
                  </div>
                  <div className="card text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/ogrenci/odevler')}>
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">Ödevlerim</h3>
                    <p className="text-secondary-600 text-sm">Ödev takibi</p>
                  </div>
                  <div className="card text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/ogrenci/hedefler')}>
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">Hedeflerim</h3>
                    <p className="text-secondary-600 text-sm">Hedef takibi</p>
                  </div>
                </>
              )}
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
