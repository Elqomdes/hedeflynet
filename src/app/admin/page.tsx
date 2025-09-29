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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Admin Dashboard</h1>
        <p className="mt-2 text-secondary-600">
          Hedefly platformunun genel durumu ve istatistikleri
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-secondary-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Hızlı İşlemler
          </h3>
          <div className="space-y-3">
            <a
              href="/admin/istekler"
              className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <FileText className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <p className="font-medium text-secondary-900">Başvuruları İncele</p>
                <p className="text-sm text-secondary-600">
                  {stats.pendingApplications} bekleyen başvuru
                </p>
              </div>
            </a>
            <a
              href="/admin/ogretmenler"
              className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Users className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-secondary-900">Öğretmenleri Yönet</p>
                <p className="text-sm text-secondary-600">
                  {stats.totalTeachers} aktif öğretmen
                </p>
              </div>
            </a>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Platform Durumu
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-secondary-600">Sistem Durumu</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Aktif
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary-600">Veritabanı</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Bağlı
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary-600">Son Güncelleme</span>
              <span className="text-secondary-900 text-sm">
                {new Date().toLocaleDateString('tr-TR')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
