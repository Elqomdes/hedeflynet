'use client';

import { useState, useEffect } from 'react';
import { FileText, Target, BookOpen, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    totalAssignments: 0,
    completedAssignments: 0,
    totalGoals: 0,
    completedGoals: 0,
    totalPlans: 0,
    completedPlans: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/student/stats');
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

  const completionRate = stats.totalAssignments > 0 
    ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100)
    : 0;

  const goalCompletionRate = stats.totalGoals > 0 
    ? Math.round((stats.completedGoals / stats.totalGoals) * 100)
    : 0;

  const statCards = [
    {
      name: 'Toplam Ödev',
      value: stats.totalAssignments,
      completed: stats.completedAssignments,
      icon: FileText,
      color: 'bg-blue-500',
      href: '/ogrenci/odevler'
    },
    {
      name: 'Hedeflerim',
      value: stats.totalGoals,
      completed: stats.completedGoals,
      icon: Target,
      color: 'bg-green-500',
      href: '/ogrenci/hedefler'
    },
    {
      name: 'Planlarım',
      value: stats.totalPlans,
      completed: stats.completedPlans,
      icon: BookOpen,
      color: 'bg-purple-500',
      href: '/ogrenci/planlar'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Öğrenci Dashboard</h1>
        <p className="mt-2 text-secondary-600">
          Ödevlerinizi takip edin, hedeflerinize ulaşın
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Ödev Tamamlama Oranı
          </h3>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-secondary-600 mb-2">
                <span>Tamamlanan</span>
                <span>{stats.completedAssignments}/{stats.totalAssignments}</span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
              <p className="text-sm text-secondary-600 mt-2">
                %{completionRate} tamamlandı
              </p>
            </div>
            <div className="ml-4 text-3xl font-bold text-primary-600">
              {completionRate}%
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Hedef Tamamlama Oranı
          </h3>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-secondary-600 mb-2">
                <span>Tamamlanan</span>
                <span>{stats.completedGoals}/{stats.totalGoals}</span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${goalCompletionRate}%` }}
                ></div>
              </div>
              <p className="text-sm text-secondary-600 mt-2">
                %{goalCompletionRate} tamamlandı
              </p>
            </div>
            <div className="ml-4 text-3xl font-bold text-green-600">
              {goalCompletionRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.name} href={stat.href} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-secondary-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-secondary-900">{stat.value}</p>
                <p className="text-sm text-secondary-500">
                  {stat.completed} tamamlandı
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Son Aktiviteler
          </h3>
          <div className="space-y-4">
            <div className="flex items-center text-sm text-secondary-600">
              <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
              <span>Dashboard&apos;a hoş geldiniz!</span>
            </div>
            <div className="flex items-center text-sm text-secondary-600">
              <FileText className="h-4 w-4 text-blue-500 mr-3" />
              <span>Ödevlerinizi kontrol edin</span>
            </div>
            <div className="flex items-center text-sm text-secondary-600">
              <Target className="h-4 w-4 text-green-500 mr-3" />
              <span>Hedeflerinizi belirleyin</span>
            </div>
            <div className="flex items-center text-sm text-secondary-600">
              <BookOpen className="h-4 w-4 text-purple-500 mr-3" />
              <span>Planlarınızı takip edin</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Hızlı Erişim
          </h3>
          <div className="space-y-3">
            <Link
              href="/ogrenci/odevler"
              className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <FileText className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-secondary-900">Ödevlerim</p>
                <p className="text-sm text-secondary-600">
                  {stats.totalAssignments} ödev
                </p>
              </div>
            </Link>
            <Link
              href="/ogrenci/hedefler"
              className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Target className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-secondary-900">Hedeflerim</p>
                <p className="text-sm text-secondary-600">
                  {stats.totalGoals} hedef
                </p>
              </div>
            </Link>
            <Link
              href="/ogrenci/planlar"
              className="flex items-center p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <BookOpen className="h-5 w-5 text-purple-600 mr-3" />
              <div>
                <p className="font-medium text-secondary-900">Planlarım</p>
                <p className="text-sm text-secondary-600">
                  {stats.totalPlans} plan
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
