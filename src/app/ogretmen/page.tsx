'use client';

import { useState, useEffect } from 'react';
import { Users, BookOpen, FileText, UserPlus, CheckCircle, Clock, Video, BarChart3, UserCheck, Target } from 'lucide-react';
import Link from 'next/link';

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalAssignments: 0,
    submittedAssignments: 0,
    gradedAssignments: 0,
    pendingGrading: 0,
    gradingRate: 0,
    // Yeni özellikler için istatistikler
    videoSessions: 0,
    totalParents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/teacher/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Toplam Öğrenci',
      value: stats.totalStudents,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      href: '/ogretmen/ogrenciler',
      description: 'Kayıtlı öğrenci sayısı'
    },
    {
      name: 'Toplam Sınıf',
      value: stats.totalClasses,
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      href: '/ogretmen/siniflar',
      description: 'Aktif sınıf sayısı'
    },
    {
      name: 'Toplam Ödev',
      value: stats.totalAssignments,
      icon: FileText,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      href: '/ogretmen/odevler',
      subtitle: `${stats.submittedAssignments} teslim edildi`,
      description: 'Oluşturulan ödev sayısı'
    },
    {
      name: 'Değerlendirme Oranı',
      value: `%${stats.gradingRate}`,
      icon: CheckCircle,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      href: '/ogretmen/odevler',
      subtitle: `${stats.gradedAssignments} değerlendirildi`,
      description: 'Tamamlanan değerlendirme oranı'
    },
    {
      name: 'Toplam Veli',
      value: stats.totalParents,
      icon: UserCheck,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      href: '/ogretmen/veliler',
      description: 'Kayıtlı veli sayısı'
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary-900 mb-2 sm:mb-3">Öğretmen Dashboard</h1>
        <p className="text-sm sm:text-base lg:text-lg text-secondary-600">
          Öğrenci koçluğunuzu yönetin ve ilerlemeleri takip edin
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-10">
        {statCards.map((stat, index) => (
          <Link key={stat.name} href={stat.href} className="group animate-scale-in h-full flex" style={{animationDelay: `${index * 0.1}s`}}>
            <div className={`relative overflow-hidden rounded-2xl ${stat.bgColor} border ${stat.borderColor} p-6 transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 group-hover:border-opacity-50 w-full h-full flex flex-col`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:shadow-glow transition-all duration-300`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors duration-300">
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p className="text-sm text-secondary-500 mt-1">{stat.subtitle}</p>
                  )}
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-end">
                <h3 className="text-lg font-semibold text-secondary-900 mb-1 group-hover:text-primary-600 transition-colors duration-300">
                  {stat.name}
                </h3>
                <p className="text-sm text-secondary-600">{stat.description}</p>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
            </div>
          </Link>
        ))}
      </div>

      {/* Assignment Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-secondary-900">Ödev Durumu</h3>
            <div className="p-2 bg-primary-50 rounded-lg">
              <FileText className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-warning-50 to-warning-100 rounded-xl border border-warning-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center">
                <div className="p-2 bg-warning-500 rounded-lg mr-3">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-secondary-700 font-semibold">Bekleyen Değerlendirme</span>
                  <p className="text-sm text-secondary-500">Değerlendirme bekleyen ödevler</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-warning-600">{stats.pendingGrading}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-success-50 to-success-100 rounded-xl border border-success-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center">
                <div className="p-2 bg-success-500 rounded-lg mr-3">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-secondary-700 font-semibold">Değerlendirildi</span>
                  <p className="text-sm text-secondary-500">Tamamlanan değerlendirmeler</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-success-600">{stats.gradedAssignments}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center">
                <div className="p-2 bg-primary-500 rounded-lg mr-3">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-secondary-700 font-semibold">Toplam Teslim</span>
                  <p className="text-sm text-secondary-500">Teslim edilen ödevler</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-primary-600">{stats.submittedAssignments}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-secondary-900">Değerlendirme İlerlemesi</h3>
            <div className="p-2 bg-success-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-success-600" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">%{stats.gradingRate}</div>
              <p className="text-secondary-600">Tamamlanan Değerlendirme</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-secondary-600">
                <span>Değerlendirilen</span>
                <span className="font-semibold">{stats.gradedAssignments}/{stats.submittedAssignments}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${stats.gradingRate}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-success-600">{stats.gradedAssignments}</div>
                <p className="text-sm text-secondary-500">Tamamlandı</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning-600">{stats.pendingGrading}</div>
                <p className="text-sm text-secondary-500">Bekliyor</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-secondary-900">Hızlı Erişim</h3>
            <div className="p-2 bg-primary-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="space-y-4">
            <Link
              href="/ogretmen/odevler"
              className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 hover:shadow-md transition-all duration-300 group"
            >
              <div className="p-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl group-hover:from-primary-600 group-hover:to-primary-700 transition-all duration-300 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors duration-300">Ödevleri Yönet</p>
                <p className="text-sm text-secondary-600">
                  {stats.totalAssignments} ödev • Değerlendirme ve takip
                </p>
              </div>
              <div className="text-primary-600 group-hover:translate-x-1 transition-transform duration-300">
                →
              </div>
            </Link>
            <Link
              href="/ogretmen/ogrenciler"
              className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 hover:shadow-md transition-all duration-300 group"
            >
              <div className="p-3 bg-gradient-to-r from-success-500 to-success-600 rounded-xl group-hover:from-success-600 group-hover:to-success-700 transition-all duration-300 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="font-semibold text-secondary-900 group-hover:text-success-600 transition-colors duration-300">Öğrenci Analizleri</p>
                <p className="text-sm text-secondary-600">
                  {stats.totalStudents} öğrenci • Performans takibi
                </p>
              </div>
              <div className="text-success-600 group-hover:translate-x-1 transition-transform duration-300">
                →
              </div>
            </Link>
            <Link
              href="/ogretmen/analiz"
              className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-purple-200 hover:shadow-md transition-all duration-300 group"
            >
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl group-hover:from-purple-600 group-hover:to-purple-700 transition-all duration-300 shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="font-semibold text-secondary-900 group-hover:text-purple-600 transition-colors duration-300">Detaylı Analiz</p>
                <p className="text-sm text-secondary-600">
                  Kapsamlı raporlar • İstatistikler
                </p>
              </div>
              <div className="text-purple-600 group-hover:translate-x-1 transition-transform duration-300">
                →
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Video Koçluk */}
      <div className="mb-6 sm:mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-secondary-900">Video Koçluk</h2>
          <Link 
            href="/ogretmen/video-koçluk"
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center group"
          >
            Tümünü Gör
            <span className="ml-1 group-hover:translate-x-1 transition-transform duration-300">→</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link href="/ogretmen/video-koçluk" className="group animate-scale-in">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                  <Video className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors duration-300">Video Koçluk</h3>
                <p className="text-secondary-600 mb-4">Canlı video oturumları ve kayıtlar</p>
                <div className="text-3xl font-bold text-blue-600 mb-2">{stats.videoSessions}</div>
                <div className="text-sm text-secondary-500">Video Oturumu</div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-secondary-900">Hızlı İşlemler</h3>
            <div className="p-2 bg-primary-50 rounded-lg">
              <Target className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="space-y-4">
            <Link
              href="/ogretmen/ogrenciler"
              className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 hover:shadow-md transition-all duration-300 group"
            >
              <div className="p-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl group-hover:from-primary-600 group-hover:to-primary-700 transition-all duration-300 shadow-lg">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors duration-300">Yeni Öğrenci Ekle</p>
                <p className="text-sm text-secondary-600">
                  Öğrenci hesabı oluşturun ve yönetin
                </p>
              </div>
              <div className="text-primary-600 group-hover:translate-x-1 transition-transform duration-300">
                →
              </div>
            </Link>
            <Link
              href="/ogretmen/siniflar"
              className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 hover:shadow-md transition-all duration-300 group"
            >
              <div className="p-3 bg-gradient-to-r from-success-500 to-success-600 rounded-xl group-hover:from-success-600 group-hover:to-success-700 transition-all duration-300 shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="font-semibold text-secondary-900 group-hover:text-success-600 transition-colors duration-300">Sınıf Oluştur</p>
                <p className="text-sm text-secondary-600">
                  Yeni sınıf açın ve öğrenci atayın
                </p>
              </div>
              <div className="text-success-600 group-hover:translate-x-1 transition-transform duration-300">
                →
              </div>
            </Link>
            <Link
              href="/ogretmen/odevler"
              className="flex items-center p-4 bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200 rounded-xl hover:from-warning-100 hover:to-warning-200 hover:shadow-md transition-all duration-300 group"
            >
              <div className="p-3 bg-gradient-to-r from-warning-500 to-warning-600 rounded-xl group-hover:from-warning-600 group-hover:to-warning-700 transition-all duration-300 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="font-semibold text-secondary-900 group-hover:text-warning-600 transition-colors duration-300">Ödev Ver</p>
                <p className="text-sm text-secondary-600">
                  Bireysel veya sınıf ödevi oluşturun
                </p>
              </div>
              <div className="text-warning-600 group-hover:translate-x-1 transition-transform duration-300">
                →
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-secondary-900">Son Aktiviteler</h3>
            <div className="p-2 bg-primary-50 rounded-lg">
              <Clock className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
              <div className="w-4 h-4 bg-primary-500 rounded-full mr-4 flex-shrink-0"></div>
              <div>
                <span className="text-secondary-700 font-semibold">Dashboard&apos;a hoş geldiniz!</span>
                <p className="text-sm text-secondary-500 mt-1">Öğrenci koçluğu platformunu keşfetmeye başlayın</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gradient-to-r from-success-50 to-success-100 rounded-xl border border-success-200">
              <div className="w-4 h-4 bg-success-500 rounded-full mr-4 flex-shrink-0"></div>
              <div>
                <span className="text-secondary-700 font-semibold">Öğrenci ekleme işlemlerine başlayabilirsiniz</span>
                <p className="text-sm text-secondary-500 mt-1">Yeni öğrenciler ekleyerek sınıfınızı oluşturun</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-4 flex-shrink-0"></div>
              <div>
                <span className="text-secondary-700 font-semibold">Sınıf oluşturarak grup çalışmaları yapabilirsiniz</span>
                <p className="text-sm text-secondary-500 mt-1">Öğrencileri gruplara ayırarak organize edin</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="w-4 h-4 bg-purple-500 rounded-full mr-4 flex-shrink-0"></div>
              <div>
                <span className="text-secondary-700 font-semibold">Ödev vererek öğrenci ilerlemesini takip edin</span>
                <p className="text-sm text-secondary-500 mt-1">Detaylı analizlerle performansı değerlendirin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
