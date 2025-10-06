'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Users, Target, BarChart3, BookOpen, CheckCircle } from 'lucide-react';
import { useDataFetching } from '@/hooks/useDataFetching';
import LoadingSpinner from '@/components/LoadingSpinner';

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
  const router = useRouter();

  // Use optimized data fetching for auth
  const { 
    data: authData, 
    loading, 
    error: authError 
  } = useDataFetching<{ user: User }>('/api/auth/me', {
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  const user = authData?.user || null;


  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Yükleniyor..." />
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
      <section className="gradient-bg py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-primary-100/30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center animate-fade-in">
            <div className="mb-12">
              <div className="w-28 h-28 bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl animate-bounce-gentle">
                <span className="text-white font-bold text-4xl">H</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-bold text-secondary-900 mb-8 bg-gradient-to-r from-secondary-900 via-primary-700 to-secondary-900 bg-clip-text text-transparent leading-tight">
                Hedefly
              </h1>
              <p className="text-2xl md:text-3xl text-secondary-700 mb-8 max-w-5xl mx-auto leading-relaxed font-medium">
                Modern öğrenci koçluğu platformu ile öğrencilerinizin potansiyelini keşfedin
              </p>
              <p className="text-xl text-secondary-600 mb-16 max-w-4xl mx-auto leading-relaxed">
                Öğrenci yönetiminden detaylı analizlere, ödev sisteminden veli iletişimine kadar 
                öğrenci koçluğunun her aşamasını dijitalleştiren kapsamlı bir platform.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-8 justify-center">
              <Link href="/giris" className="btn-primary text-xl px-12 py-5 btn-lg inline-flex items-center justify-center group hover:scale-105 transition-all duration-300">
                Hemen Başla
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link href="/iletisim" className="btn-outline text-xl px-12 py-5 btn-lg hover:scale-105 transition-all duration-300">
                İletişime Geç
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">Platform Özellikleri</h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
              Hedefly, öğrenci koçluğunun her aşamasını dijitalleştiren kapsamlı bir platform sunar.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200 hover:shadow-xl transition-all duration-300 animate-slide-up">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">Öğrenci Yönetimi</h3>
              <ul className="space-y-3 text-secondary-700">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Kolay öğrenci ekleme ve düzenleme</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Sınıf oluşturma ve öğrenci atama</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Bireysel koçluk takibi</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border border-green-200 hover:shadow-xl transition-all duration-300 animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">Ödev Sistemi</h3>
              <ul className="space-y-3 text-secondary-700">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>PDF, video ve link ile ödev verme</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Otomatik teslim takibi</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Detaylı değerlendirme ve geri bildirim</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 border border-purple-200 hover:shadow-xl transition-all duration-300 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">Detaylı Analiz</h3>
              <ul className="space-y-3 text-secondary-700">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Performans grafikleri ve raporlar</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Branş bazlı analiz</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>İlerleme takibi ve öneriler</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 border border-orange-200 hover:shadow-xl transition-all duration-300 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">Hedef Belirleme</h3>
              <ul className="space-y-3 text-secondary-700">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Kişiselleştirilmiş hedef oluşturma</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Hedef takibi ve güncelleme</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Motivasyon ve başarı takibi</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-8 border border-indigo-200 hover:shadow-xl transition-all duration-300 animate-slide-up" style={{animationDelay: '0.4s'}}>
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
          </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">Planlama Sistemi</h3>
              <ul className="space-y-3 text-secondary-700">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Günlük, haftalık ve aylık planlar</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Otomatik plan takibi</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Esnek plan düzenleme</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-8 border border-teal-200 hover:shadow-xl transition-all duration-300 animate-slide-up" style={{animationDelay: '0.5s'}}>
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
            </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">Veli Portalı</h3>
              <ul className="space-y-3 text-secondary-700">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Detaylı ilerleme raporları</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Anlık bildirimler</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Öğretmen ile iletişim</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* Why Hedefly Section */}
      <section className="py-24 bg-gradient-to-br from-secondary-50 to-primary-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-secondary-50/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
              Neden Hedefly?
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
              Modern eğitim teknolojileri ile öğrenci koçluğunuzu bir üst seviyeye taşıyın
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group animate-scale-in">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                Kolay Kullanım
              </h3>
              <p className="text-secondary-600 leading-relaxed mb-4">
                Sezgisel arayüz ile öğrenci koçluğunuzu kolayca yönetin. Teknik bilgi gerektirmez.
              </p>
              <div className="text-sm text-primary-600 font-semibold">
                ✓ 5 dakikada kurulum
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group animate-scale-in" style={{animationDelay: '0.1s'}}>
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                Detaylı Raporlama
              </h3>
              <p className="text-secondary-600 leading-relaxed mb-4">
                Öğrenci performansını grafiklerle analiz edin ve velilere detaylı raporlar sunun.
              </p>
              <div className="text-sm text-primary-600 font-semibold">
                ✓ Gerçek zamanlı analiz
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group animate-scale-in" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                Kişiselleştirilmiş Yaklaşım
              </h3>
              <p className="text-secondary-600 leading-relaxed mb-4">
                Her öğrenci için özel hedefler belirleyin ve bireysel ilerleme takibi yapın.
              </p>
              <div className="text-sm text-primary-600 font-semibold">
                ✓ Bireysel koçluk
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group animate-scale-in" style={{animationDelay: '0.3s'}}>
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                Kapsamlı Ödev Sistemi
              </h3>
              <p className="text-secondary-600 leading-relaxed mb-4">
                PDF, video, link ile ödevler verin, otomatik takip yapın ve detaylı değerlendirme yapın.
              </p>
              <div className="text-sm text-primary-600 font-semibold">
                ✓ Çoklu format desteği
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group animate-scale-in" style={{animationDelay: '0.4s'}}>
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                Veli İletişimi
              </h3>
              <p className="text-secondary-600 leading-relaxed mb-4">
                Veliler çocuklarının ilerlemesini anlık olarak takip edebilir ve sizinle iletişim kurabilir.
              </p>
              <div className="text-sm text-primary-600 font-semibold">
                ✓ Anlık bildirimler
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group animate-scale-in" style={{animationDelay: '0.5s'}}>
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                Güvenli Platform
              </h3>
              <p className="text-secondary-600 leading-relaxed mb-4">
                Tüm verileriniz güvenli şekilde saklanır ve sadece yetkili kişiler erişebilir.
              </p>
              <div className="text-sm text-primary-600 font-semibold">
                ✓ SSL şifreleme
              </div>
            </div>
            </div>

          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">500+</div>
              <div className="text-secondary-600">Aktif Öğretmen</div>
              </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">2000+</div>
              <div className="text-secondary-600">Başarılı Öğrenci</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">95%</div>
              <div className="text-secondary-600">Memnuniyet Oranı</div>
              </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">24/7</div>
              <div className="text-secondary-600">Platform Erişimi</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-bg py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-primary-100/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
              Öğrenci Koçluğunuzu Dijitalleştirin
            </h2>
            <p className="text-xl text-secondary-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Hedefly ile öğrencilerinizin potansiyelini keşfedin ve başarılarını artırın
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 mb-2">Ücretsiz</div>
                <div className="text-secondary-600">Başlangıç paketi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 mb-2">Hızlı</div>
                <div className="text-secondary-600">5 dakikada kurulum</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 mb-2">Güvenli</div>
                <div className="text-secondary-600">SSL şifreleme</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/iletisim" className="btn-primary text-lg px-10 py-4 btn-lg inline-flex items-center justify-center">
                Öğretmen Başvurusu Yap
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link href="/giris" className="btn-outline text-lg px-10 py-4 btn-lg">
                Giriş Yap
              </Link>
            </div>
            <p className="text-sm text-secondary-500 mt-6">
              Zaten hesabınız var mı? <Link href="/giris" className="text-primary-600 hover:text-primary-700 font-medium">Giriş yapın</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
