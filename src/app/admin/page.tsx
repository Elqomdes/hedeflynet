'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, UserCheck, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    pendingApplications: 0,
    totalClasses: 0
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
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-secondary-900 mb-3">Admin Dashboard</h1>
        <p className="text-lg text-secondary-600">
          Hedefly platformunun genel durumu ve istatistikleri
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
