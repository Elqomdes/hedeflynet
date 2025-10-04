'use client';

import { useState, useEffect } from 'react';
import { Users, BookOpen, FileText, Target, TrendingUp, UserPlus, CheckCircle, Star, Clock, Brain, Award, Video, BarChart3, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalAssignments: 0,
    totalGoals: 0,
    submittedAssignments: 0,
    gradedAssignments: 0,
    pendingGrading: 0,
    gradingRate: 0,
    // Yeni özellikler için istatistikler
    aiRecommendations: 0,
    videoSessions: 0,
    adaptiveLearningModules: 0,
    mobileUsers: 0,
    socialLearningPosts: 0,
    gamificationPoints: 0
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
      color: 'bg-blue-500',
      href: '/ogretmen/ogrenciler'
    },
    {
      name: 'Toplam Sınıf',
      value: stats.totalClasses,
      icon: BookOpen,
      color: 'bg-green-500',
      href: '/ogretmen/siniflar'
    },
    {
      name: 'Toplam Ödev',
      value: stats.totalAssignments,
      icon: FileText,
      color: 'bg-yellow-500',
      href: '/ogretmen/odevler',
      subtitle: `${stats.submittedAssignments} teslim edildi`
    },
    {
      name: 'Değerlendirme Oranı',
      value: `%${stats.gradingRate}`,
      icon: CheckCircle,
      color: 'bg-purple-500',
      href: '/ogretmen/odevler',
      subtitle: `${stats.gradedAssignments} değerlendirildi`
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-secondary-900 mb-3">Öğretmen Dashboard</h1>
        <p className="text-lg text-secondary-600">
          Öğrenci koçluğunuzu yönetin ve ilerlemeleri takip edin
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {statCards.map((stat, index) => (
          <Link key={stat.name} href={stat.href} className="card card-hover group animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
            <div className="flex items-center">
              <div className={`p-4 rounded-2xl ${stat.color} shadow-lg group-hover:shadow-glow transition-all duration-300`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-semibold text-secondary-600 mb-1">{stat.name}</p>
                <p className="text-3xl font-bold text-secondary-900 mb-1">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-sm text-secondary-500">{stat.subtitle}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Assignment Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="card card-hover animate-slide-up">
          <div className="card-header">
            <h3 className="card-title">
              Ödev Durumu
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-warning-50 rounded-xl">
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-warning-600 mr-3" />
                <span className="text-secondary-700 font-medium">Bekleyen Değerlendirme</span>
              </div>
              <span className="text-2xl font-bold text-warning-600">{stats.pendingGrading}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-success-50 rounded-xl">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-success-600 mr-3" />
                <span className="text-secondary-700 font-medium">Değerlendirildi</span>
              </div>
              <span className="text-2xl font-bold text-success-600">{stats.gradedAssignments}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary-50 rounded-xl">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-primary-600 mr-3" />
                <span className="text-secondary-700 font-medium">Toplam Teslim</span>
              </div>
              <span className="text-2xl font-bold text-primary-600">{stats.submittedAssignments}</span>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="card-header">
            <h3 className="card-title">
              Değerlendirme İlerlemesi
            </h3>
          </div>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-secondary-600 mb-3">
                <span>Değerlendirilen</span>
                <span className="font-semibold">{stats.gradedAssignments}/{stats.submittedAssignments}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill progress-primary"
                  style={{ width: `${stats.gradingRate}%` }}
                ></div>
              </div>
              <p className="text-sm text-secondary-600 mt-3">
                %{stats.gradingRate} tamamlandı
              </p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-slide-up" style={{animationDelay: '0.2s'}}>
          <div className="card-header">
            <h3 className="card-title">
              Hızlı Erişim
            </h3>
          </div>
          <div className="space-y-4">
            <Link
              href="/ogretmen/odevler"
              className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 group"
            >
              <div className="p-3 bg-primary-500 rounded-xl group-hover:bg-primary-600 transition-colors duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="font-semibold text-secondary-900">Ödevleri Yönet</p>
                <p className="text-sm text-secondary-600">
                  {stats.totalAssignments} ödev
                </p>
              </div>
            </Link>
            <Link
              href="/ogretmen/ogrenciler"
              className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 group"
            >
              <div className="p-3 bg-success-500 rounded-xl group-hover:bg-success-600 transition-colors duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="font-semibold text-secondary-900">Öğrenci Analizleri</p>
                <p className="text-sm text-secondary-600">
                  {stats.totalStudents} öğrenci
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Yeni Özellikler */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-secondary-900 mb-6">Yeni Özellikler (v3.4)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card card-hover group animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">AI Koçluk</h3>
              <p className="text-secondary-600 mb-4">Yapay zeka destekli öğrenci koçluğu</p>
              <div className="text-2xl font-bold text-purple-600">{stats.aiRecommendations}</div>
              <div className="text-sm text-secondary-500">AI Önerisi</div>
            </div>
          </div>

          <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.1s'}}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">Video Koçluk</h3>
              <p className="text-secondary-600 mb-4">Canlı video oturumları</p>
              <div className="text-2xl font-bold text-blue-600">{stats.videoSessions}</div>
              <div className="text-sm text-secondary-500">Video Oturumu</div>
            </div>
          </div>

          <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.2s'}}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">Adaptif Öğrenme</h3>
              <p className="text-secondary-600 mb-4">Kişiselleştirilmiş öğrenme modülleri</p>
              <div className="text-2xl font-bold text-green-600">{stats.adaptiveLearningModules}</div>
              <div className="text-sm text-secondary-500">Öğrenme Modülü</div>
            </div>
          </div>

          <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.3s'}}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">Gamification</h3>
              <p className="text-secondary-600 mb-4">Puan ve rozet sistemi</p>
              <div className="text-2xl font-bold text-orange-600">{stats.gamificationPoints}</div>
              <div className="text-sm text-secondary-500">Toplam Puan</div>
            </div>
          </div>

          <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.4s'}}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">Sosyal Öğrenme</h3>
              <p className="text-secondary-600 mb-4">Çalışma grupları ve topluluk</p>
              <div className="text-2xl font-bold text-pink-600">{stats.socialLearningPosts}</div>
              <div className="text-sm text-secondary-500">Topluluk Gönderisi</div>
            </div>
          </div>

          <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.5s'}}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">Mobil Uygulama</h3>
              <p className="text-secondary-600 mb-4">Mobil cihazlardan erişim</p>
              <div className="text-2xl font-bold text-indigo-600">{stats.mobileUsers}</div>
              <div className="text-sm text-secondary-500">Mobil Kullanıcı</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card animate-slide-up">
          <div className="card-header">
            <h3 className="card-title">
              Hızlı İşlemler
            </h3>
          </div>
          <div className="space-y-4">
            <Link
              href="/ogretmen/ogrenciler"
              className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 group"
            >
              <div className="p-3 bg-primary-500 rounded-xl group-hover:bg-primary-600 transition-colors duration-300">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="font-semibold text-secondary-900">Yeni Öğrenci Ekle</p>
                <p className="text-sm text-secondary-600">
                  Öğrenci hesabı oluşturun
                </p>
              </div>
            </Link>
            <Link
              href="/ogretmen/siniflar"
              className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 group"
            >
              <div className="p-3 bg-success-500 rounded-xl group-hover:bg-success-600 transition-colors duration-300">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="font-semibold text-secondary-900">Sınıf Oluştur</p>
                <p className="text-sm text-secondary-600">
                  Yeni sınıf açın ve öğrenci atayın
                </p>
              </div>
            </Link>
            <Link
              href="/ogretmen/odevler"
              className="flex items-center p-4 bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200 rounded-xl hover:from-warning-100 hover:to-warning-200 transition-all duration-300 group"
            >
              <div className="p-3 bg-warning-500 rounded-xl group-hover:bg-warning-600 transition-colors duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="font-semibold text-secondary-900">Ödev Ver</p>
                <p className="text-sm text-secondary-600">
                  Bireysel veya sınıf ödevi oluşturun
                </p>
              </div>
            </Link>
          </div>
        </div>

        <div className="card animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="card-header">
            <h3 className="card-title">
              Son Aktiviteler
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-primary-50 rounded-xl">
              <div className="w-3 h-3 bg-primary-500 rounded-full mr-4"></div>
              <span className="text-secondary-700 font-medium">Dashboard&apos;a hoş geldiniz!</span>
            </div>
            <div className="flex items-center p-3 bg-success-50 rounded-xl">
              <div className="w-3 h-3 bg-success-500 rounded-full mr-4"></div>
              <span className="text-secondary-700 font-medium">Öğrenci ekleme işlemlerine başlayabilirsiniz</span>
            </div>
            <div className="flex items-center p-3 bg-blue-50 rounded-xl">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-4"></div>
              <span className="text-secondary-700 font-medium">Sınıf oluşturarak grup çalışmaları yapabilirsiniz</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
