'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock, Calendar, Star, BarChart3, Video, Bell, Award, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  children: Array<{
    id: string;
    firstName: string;
    lastName: string;
    className?: string;
  }>;
  stats: Array<{
    studentId: string;
    studentName: string;
    totalAssignments: number;
    completedAssignments: number;
    averageGrade: number;
    completedSessions?: number;
    totalSessions?: number;
    lastActivity?: string;
    performanceTrend?: 'improving' | 'stable' | 'declining';
  }>;
  notifications: {
    unread: number;
  };
  recentReports?: Array<any>;
  upcomingEvents?: Array<any>;
}

export default function ParentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/parent/dashboard', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Dashboard data:', result);
        setData(result.data);
      } else {
        console.error('Dashboard fetch failed');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
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

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-bold text-secondary-900 mb-2">Veli Dashboard</h2>
          <p className="text-secondary-600">Veri yüklenemedi</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Çocuklarım',
      value: data.children?.length || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      href: '#',
      description: 'Aktif öğrenciler'
    },
    {
      name: 'Toplam Ödev',
      value: data.stats?.reduce((sum, stat) => sum + (stat.totalAssignments || 0), 0) || 0,
      icon: FileText,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      href: '#',
      description: 'Toplam ödev sayısı'
    },
    {
      name: 'Tamamlanan',
      value: data.stats?.reduce((sum, stat) => sum + (stat.completedAssignments || 0), 0) || 0,
      icon: CheckCircle,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      href: '#',
      description: 'Tamamlanan ödevler'
    },
    {
      name: 'Ortalama Not',
      value: data.stats && data.stats.length > 0
        ? (data.stats.reduce((sum, stat) => sum + (stat.averageGrade || 0), 0) / data.stats.length).toFixed(1)
        : '0',
      icon: Star,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      href: '#',
      description: 'Genel ortalama'
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary-900 mb-2 sm:mb-3">Veli Dashboard</h1>
        <p className="text-sm sm:text-base lg:text-lg text-secondary-600">
          Çocuklarınızın eğitim durumunu takip edin ve ilerlemeleri inceleyin
        </p>
      </div>

      {/* Notifications */}
      {data.notifications?.unread > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
          <Bell className="w-5 h-5 text-blue-600 mr-2" />
          <span className="text-blue-800 font-medium">
            {data.notifications.unread} okunmamış bildiriminiz var
          </span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-10">
        {statCards.map((stat, index) => (
          <div key={stat.name} className="group animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
            <div className={`relative overflow-hidden rounded-2xl ${stat.bgColor} border ${stat.borderColor} p-6 transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 group-hover:border-opacity-50`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:shadow-glow transition-all duration-300`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors duration-300">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-1 group-hover:text-primary-600 transition-colors duration-300">
                  {stat.name}
                </h3>
                <p className="text-sm text-secondary-600">{stat.description}</p>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Children Overview */}
      {data.children && data.children.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-secondary-900 mb-3 sm:mb-4">Çocuklarınız</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {data.children.map((child, index) => {
              const childStats = data.stats?.find(s => s.studentId === child.id);
              const completionRate = childStats && childStats.totalAssignments > 0
                ? Math.round((childStats.completedAssignments / childStats.totalAssignments) * 100)
                : 0;

              return (
                <div key={child.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-base font-bold text-secondary-900">{child.firstName} {child.lastName}</h3>
                      {child.className && (
                        <p className="text-xs text-secondary-500">{child.className}</p>
                      )}
                    </div>
                  </div>

                  {childStats && (
                    <div className="space-y-4">
                      {/* Performance Trend */}
                      {childStats.performanceTrend && (
                        <div className={`flex items-center justify-center p-2 rounded-lg ${
                          childStats.performanceTrend === 'improving' ? 'bg-green-50 text-green-700' :
                          childStats.performanceTrend === 'declining' ? 'bg-red-50 text-red-700' :
                          'bg-yellow-50 text-yellow-700'
                        }`}>
                          {childStats.performanceTrend === 'improving' && <TrendingUp className="w-4 h-4 mr-1" />}
                          {childStats.performanceTrend === 'declining' && <TrendingDown className="w-4 h-4 mr-1" />}
                          {childStats.performanceTrend === 'stable' && <Minus className="w-4 h-4 mr-1" />}
                          <span className="text-xs font-semibold">
                            {childStats.performanceTrend === 'improving' ? '📈 Yükselişte' :
                             childStats.performanceTrend === 'declining' ? '📉 Düşüşte' :
                             '➖ Stabil'}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <div className="text-2xl font-bold text-blue-600">{childStats.averageGrade || 0}</div>
                          <div className="text-xs text-secondary-600">Ortalama Not</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-xl border border-green-100">
                          <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
                          <div className="text-xs text-secondary-600">Tamamlama</div>
                        </div>
                      </div>

                      {/* Video Sessions Progress */}
                      {childStats.totalSessions !== undefined && childStats.totalSessions > 0 && (
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <div className="flex items-center text-purple-700">
                              <Video className="w-4 h-4 mr-1" />
                              <span className="font-semibold">Video Koçluk</span>
                            </div>
                            <span className="font-semibold text-purple-600">
                              {childStats.completedSessions || 0}/{childStats.totalSessions}
                            </span>
                          </div>
                          <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000"
                              style={{ width: `${Math.round(((childStats.completedSessions || 0) / childStats.totalSessions) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Assignment Progress */}
                      {childStats.totalAssignments > 0 && (
                        <div>
                          <div className="flex justify-between text-sm text-secondary-600 mb-2">
                            <span className="flex items-center">
                              <FileText className="w-4 h-4 mr-1" />
                              Ödevler
                            </span>
                            <span className="font-semibold text-secondary-900">
                              {childStats.completedAssignments}/{childStats.totalAssignments}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-1000"
                              style={{ width: `${completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Last Activity */}
                      {childStats.lastActivity && (
                        <div className="text-center text-xs text-secondary-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Son aktivite: {new Date(childStats.lastActivity).toLocaleDateString('tr-TR')}
                        </div>
                      )}

                      {/* Action Button */}
                      <Link 
                        href={`/veli/ogrenci/${child.id}`}
                        className="block w-full text-center py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-semibold flex items-center justify-center"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Detaylı Görüntüle
                      </Link>
                    </div>
                  )}

                  {!childStats && (
                    <div className="text-center py-4 text-secondary-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-secondary-400" />
                      <p className="text-sm">Henüz veri yok</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!data.children || data.children.length === 0) && (
        <div className="mb-10">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <Users className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-secondary-900 mb-2">Henüz öğrenci eklenmedi</h3>
            <p className="text-secondary-600">Çocuklar&apos;ınızın verilerini görmek için öğretmeninizden hesap bağlantısı isteyin</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 animate-slide-up">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-secondary-900 mb-2">Raporlar</h3>
            <p className="text-sm text-secondary-600">Performans raporlarını görüntüleyin</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-secondary-900 mb-2">Bildirimler</h3>
            <p className="text-sm text-secondary-600">{data.notifications?.unread || 0} okunmamış</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-secondary-900 mb-2">Analiz</h3>
            <p className="text-sm text-secondary-600">Detaylı performans analizi</p>
          </div>
        </div>

        
      </div>
    </div>
  );
}