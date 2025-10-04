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
      <div className="min-h-screen gradient-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center animate-fade-in">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                <span className="text-white font-bold text-2xl">
                  {user.firstName.charAt(0).toUpperCase()}
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-secondary-900 mb-4">
                Hoş geldin, {user.firstName}! 👋
              </h1>
              <p className="text-xl text-secondary-700 mb-8 max-w-2xl mx-auto">
                Dashboard&apos;unuza erişmek için aşağıdaki butonlardan birini seçin
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
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
                className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center btn-lg"
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
                className="btn-outline text-lg px-8 py-4 btn-lg"
              >
                Çıkış Yap
              </button>
            </div>

            {/* Dashboard quick access cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              {user.role === 'admin' && (
                <>
                  <div className="card card-hover text-center cursor-pointer group animate-scale-in" onClick={() => router.push('/admin')}>
                    <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-3">Yönetici Paneli</h3>
                    <p className="text-secondary-600">Sistem yönetimi ve genel bakış</p>
                  </div>
                  <div className="card card-hover text-center cursor-pointer group animate-scale-in" style={{animationDelay: '0.1s'}} onClick={() => router.push('/admin/ogretmenler')}>
                    <div className="w-16 h-16 bg-gradient-to-r from-success-500 to-success-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-3">Öğretmenler</h3>
                    <p className="text-secondary-600">Öğretmen yönetimi</p>
                  </div>
                  <div className="card card-hover text-center cursor-pointer group animate-scale-in" style={{animationDelay: '0.2s'}} onClick={() => router.push('/admin/istekler')}>
                    <div className="w-16 h-16 bg-gradient-to-r from-warning-500 to-warning-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-3">Başvurular</h3>
                    <p className="text-secondary-600">Öğretmen başvuruları</p>
                  </div>
                </>
              )}
              
              {user.role === 'teacher' && (
                <>
                  <div className="card card-hover text-center cursor-pointer group animate-scale-in" onClick={() => router.push('/ogretmen')}>
                    <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-3">Öğretmen Paneli</h3>
                    <p className="text-secondary-600">Ana dashboard</p>
                  </div>
                  <div className="card card-hover text-center cursor-pointer group animate-scale-in" style={{animationDelay: '0.1s'}} onClick={() => router.push('/ogretmen/ogrenciler')}>
                    <div className="w-16 h-16 bg-gradient-to-r from-success-500 to-success-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-3">Öğrencilerim</h3>
                    <p className="text-secondary-600">Öğrenci yönetimi</p>
                  </div>
                  <div className="card card-hover text-center cursor-pointer group animate-scale-in" style={{animationDelay: '0.2s'}} onClick={() => router.push('/ogretmen/odevler')}>
                    <div className="w-16 h-16 bg-gradient-to-r from-warning-500 to-warning-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-3">Ödevler</h3>
                    <p className="text-secondary-600">Ödev yönetimi</p>
                  </div>
                </>
              )}
              
              {user.role === 'student' && (
                <>
                  <div className="card card-hover text-center cursor-pointer group animate-scale-in" onClick={() => router.push('/ogrenci')}>
                    <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-3">Öğrenci Paneli</h3>
                    <p className="text-secondary-600">Ana dashboard</p>
                  </div>
                  <div className="card card-hover text-center cursor-pointer group animate-scale-in" style={{animationDelay: '0.1s'}} onClick={() => router.push('/ogrenci/odevler')}>
                    <div className="w-16 h-16 bg-gradient-to-r from-success-500 to-success-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-3">Ödevlerim</h3>
                    <p className="text-secondary-600">Ödev takibi</p>
                  </div>
                  <div className="card card-hover text-center cursor-pointer group animate-scale-in" style={{animationDelay: '0.2s'}} onClick={() => router.push('/ogrenci/hedefler')}>
                    <div className="w-16 h-16 bg-gradient-to-r from-warning-500 to-warning-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-3">Hedeflerim</h3>
                    <p className="text-secondary-600">Hedef takibi</p>
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
      <section className="gradient-bg py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-primary-100/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center animate-fade-in">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow animate-bounce-gentle">
                <span className="text-white font-bold text-3xl">H</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-secondary-900 mb-6 bg-gradient-to-r from-secondary-900 via-primary-700 to-secondary-900 bg-clip-text text-transparent">
                Hedefly
              </h1>
              <p className="text-xl md:text-2xl text-secondary-700 mb-12 max-w-4xl mx-auto leading-relaxed">
                Modern öğrenci koçluk platformu ile öğrencilerinizin hedeflerine ulaşmasına yardımcı olun
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/giris" className="btn-primary text-lg px-10 py-4 btn-lg">
                Hemen Başla
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link href="/iletisim" className="btn-outline text-lg px-10 py-4 btn-lg">
                İletişime Geç
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
              Neden Hedefly?
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
              Öğrenci koçluğunuzu dijitalleştirin ve daha etkili sonuçlar alın
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card card-hover text-center group animate-scale-in">
              <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-4">
                Öğrenci Yönetimi
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                Öğrencilerinizi kolayca ekleyin, sınıflar oluşturun ve bireysel koçluk yapın.
              </p>
            </div>

            <div className="card card-hover text-center group animate-scale-in" style={{animationDelay: '0.1s'}}>
              <div className="w-20 h-20 bg-gradient-to-r from-success-500 to-success-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-4">
                Ödev Sistemi
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                PDF, video ve link ile ödevler verin, takip edin ve değerlendirin.
              </p>
            </div>

            <div className="card card-hover text-center group animate-scale-in" style={{animationDelay: '0.2s'}}>
              <div className="w-20 h-20 bg-gradient-to-r from-warning-500 to-warning-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-4">
                Hedef Belirleme
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                Öğrencilerinize hedefler belirleyin ve ilerlemelerini takip edin.
              </p>
            </div>

            <div className="card card-hover text-center group animate-scale-in" style={{animationDelay: '0.3s'}}>
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-4">
                Detaylı Analiz
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                Öğrenci performansını grafiklerle analiz edin ve raporlar oluşturun.
              </p>
            </div>

            <div className="card card-hover text-center group animate-scale-in" style={{animationDelay: '0.4s'}}>
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-4">
                Planlama
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                Günlük, haftalık ve aylık planlar oluşturun ve takip edin.
              </p>
            </div>

            <div className="card card-hover text-center group animate-scale-in" style={{animationDelay: '0.5s'}}>
              <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-4">
                AI Koçluk Sistemi
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                Yapay zeka destekli kişiselleştirilmiş öğrenme önerileri ve çalışma planları.
              </p>
            </div>

            <div className="card card-hover text-center group animate-scale-in" style={{animationDelay: '0.6s'}}>
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-4">
                Gamification
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                Puan, rozet ve seviye sistemi ile öğrenmeyi eğlenceli hale getirin.
              </p>
            </div>

            <div className="card card-hover text-center group animate-scale-in" style={{animationDelay: '0.7s'}}>
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-4">
                Sosyal Öğrenme
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                Çalışma grupları, oturumlar ve topluluk etkileşimi ile birlikte öğrenin.
              </p>
            </div>

            <div className="card card-hover text-center group animate-scale-in" style={{animationDelay: '0.8s'}}>
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-4">
                Veli Portalı
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                Ebeveynler çocuklarının ilerlemesini detaylı raporlarla takip edebilir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-bg py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-primary-100/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
              Hemen Başlayın
            </h2>
            <p className="text-xl text-secondary-700 mb-12 max-w-3xl mx-auto leading-relaxed">
              Öğretmen başvurusu yapın ve öğrenci koçluğunuzu dijitalleştirin
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/iletisim" className="btn-primary text-lg px-10 py-4 btn-lg">
                Öğretmen Başvurusu Yap
              </Link>
              <Link href="/giris" className="btn-outline text-lg px-10 py-4 btn-lg">
                Giriş Yap
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
