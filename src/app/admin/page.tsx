'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, UserCheck, TrendingUp, Video, BarChart3, Activity, CreditCard, Gift, AlertTriangle, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    pendingApplications: 0,
    totalClasses: 0,
    // Yeni özellikler için istatistikler
    totalParents: 0,
    videoSessions: 0,
    systemHealth: 'excellent',
    // Abonelik istatistikleri
    activeSubscriptions: 0,
    freeTrialTeachers: 0,
    expiredSubscriptions: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
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
      name: 'Toplam Öğretmen',
      value: stats.totalTeachers,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'Toplam Öğrenci',
      value: stats.totalStudents,
      icon: UserCheck,
      color: 'bg-green-500'
    },
    {
      name: 'Bekleyen Başvurular',
      value: stats.pendingApplications,
      icon: FileText,
      color: 'bg-yellow-500'
    },
    {
      name: 'Toplam Sınıf',
      value: stats.totalClasses,
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary-900 mb-2 sm:mb-3">Admin Dashboard</h1>
        <p className="text-sm sm:text-base lg:text-lg text-secondary-600">
          Hedefly platformunun genel durumu ve istatistikleri
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-10">
        {statCards.map((stat, index) => (
          <div key={stat.name} className="card card-hover group animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
            <div className="flex items-center">
              <div className={`p-4 rounded-2xl ${stat.color} shadow-lg group-hover:shadow-glow transition-all duration-300`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-semibold text-secondary-600 mb-1">{stat.name}</p>
                <p className="text-3xl font-bold text-secondary-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Abonelik İstatistikleri */}
      <div className="mb-6 sm:mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-4 sm:mb-6">Abonelik İstatistikleri</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="card card-hover group animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">Aktif Abonelik</h3>
              <div className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</div>
              <div className="text-sm text-secondary-500">Öğretmen</div>
            </div>
          </div>

          <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.1s'}}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">Ücretsiz Deneme</h3>
              <div className="text-2xl font-bold text-blue-600">{stats.freeTrialTeachers}</div>
              <div className="text-sm text-secondary-500">Öğretmen</div>
            </div>
          </div>

          <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.2s'}}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">Süresi Dolmuş</h3>
              <div className="text-2xl font-bold text-red-600">{stats.expiredSubscriptions}</div>
              <div className="text-sm text-secondary-500">Abonelik</div>
            </div>
          </div>

          <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.3s'}}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">Toplam Gelir</h3>
              <div className="text-2xl font-bold text-purple-600">₺{stats.totalRevenue}</div>
              <div className="text-sm text-secondary-500">Bu Ay</div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Özellikleri */}
      <div className="mb-6 sm:mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-4 sm:mb-6">Platform Özellikleri</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="card card-hover group animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">Video Koçluk</h3>
              <div className="text-2xl font-bold text-blue-600">{stats.videoSessions}</div>
              <div className="text-sm text-secondary-500">Video Oturumu</div>
            </div>
          </div>

          <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.1s'}}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">Veli Portalı</h3>
              <div className="text-2xl font-bold text-teal-600">{stats.totalParents}</div>
              <div className="text-sm text-secondary-500">Kayıtlı Veli</div>
            </div>
          </div>

          <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.2s'}}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">Sistem Sağlığı</h3>
              <div className="text-2xl font-bold text-emerald-600 capitalize">{stats.systemHealth}</div>
              <div className="text-sm text-secondary-500">Platform Durumu</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="card animate-slide-up">
          <div className="card-header">
            <h3 className="card-title">
              Hızlı İşlemler
            </h3>
          </div>
          <div className="space-y-4">
            <a
              href="/admin/istekler"
              className="flex items-center p-4 bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200 rounded-xl hover:from-warning-100 hover:to-warning-200 transition-all duration-300 group"
            >
              <div className="p-3 bg-warning-500 rounded-xl group-hover:bg-warning-600 transition-colors duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="font-semibold text-secondary-900">Başvuruları İncele</p>
                <p className="text-sm text-secondary-600">
                  {stats.pendingApplications} bekleyen başvuru
                </p>
              </div>
            </a>
            <a
              href="/admin/ogretmenler"
              className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 group"
            >
              <div className="p-3 bg-primary-500 rounded-xl group-hover:bg-primary-600 transition-colors duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="font-semibold text-secondary-900">Öğretmenleri Yönet</p>
                <p className="text-sm text-secondary-600">
                  {stats.totalTeachers} aktif öğretmen
                </p>
              </div>
            </a>
          </div>
        </div>

        <div className="card animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="card-header">
            <h3 className="card-title">
              Platform Durumu
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-success-50 rounded-xl">
              <span className="text-secondary-700 font-medium">Sistem Durumu</span>
              <span className="badge badge-success">
                Aktif
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-success-50 rounded-xl">
              <span className="text-secondary-700 font-medium">Veritabanı</span>
              <span className="badge badge-success">
                Bağlı
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-primary-50 rounded-xl">
              <span className="text-secondary-700 font-medium">Son Güncelleme</span>
              <span className="text-secondary-900 font-semibold">
                {new Date().toLocaleDateString('tr-TR')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
