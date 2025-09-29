'use client';

import { useState, useEffect } from 'react';
import { Users, BookOpen, FileText, Target, TrendingUp, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalAssignments: 0,
    totalGoals: 0
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
      href: '/ogretmen/odevler'
    },
    {
      name: 'Aktif Hedefler',
      value: stats.totalGoals,
      icon: Target,
      color: 'bg-purple-500',
      href: '/ogretmen/hedefler'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Öğretmen Dashboard</h1>
        <p className="mt-2 text-secondary-600">
          Öğrenci koçluğunuzu yönetin ve ilerlemeleri takip edin
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.name} href={stat.href} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-secondary-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Hızlı İşlemler
          </h3>
          <div className="space-y-3">
            <Link
              href="/ogretmen/ogrenciler"
              className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <UserPlus className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-secondary-900">Yeni Öğrenci Ekle</p>
                <p className="text-sm text-secondary-600">
                  Öğrenci hesabı oluşturun
                </p>
              </div>
            </Link>
            <Link
              href="/ogretmen/siniflar"
              className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <BookOpen className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-secondary-900">Sınıf Oluştur</p>
                <p className="text-sm text-secondary-600">
                  Yeni sınıf açın ve öğrenci atayın
                </p>
              </div>
            </Link>
            <Link
              href="/ogretmen/odevler"
              className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <FileText className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <p className="font-medium text-secondary-900">Ödev Ver</p>
                <p className="text-sm text-secondary-600">
                  Bireysel veya sınıf ödevi oluşturun
                </p>
              </div>
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Son Aktiviteler
          </h3>
          <div className="space-y-4">
            <div className="flex items-center text-sm text-secondary-600">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              <span>Dashboard&apos;a hoş geldiniz!</span>
            </div>
            <div className="flex items-center text-sm text-secondary-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span>Öğrenci ekleme işlemlerine başlayabilirsiniz</span>
            </div>
            <div className="flex items-center text-sm text-secondary-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span>Sınıf oluşturarak grup çalışmaları yapabilirsiniz</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
