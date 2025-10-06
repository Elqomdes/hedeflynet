'use client';

import { useState, useEffect } from 'react';
import { Users, Bell, FileText, TrendingUp, AlertTriangle, CheckCircle, Clock, Star, Video, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface ParentDashboardData {
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    children: {
      id: string;
      firstName: string;
      lastName: string;
      class?: string;
      teacher?: string;
    }[];
  };
  notifications: {
    unread: number;
    recent: any[];
  };
  childrenStats: {
    studentId: string;
    studentName: string;
    assignmentsCompleted: number;
    assignmentsTotal: number;
    averageGrade: number;
    goalsAchieved: number;
    goalsTotal: number;
    lastActivity: string;
    performanceTrend: 'improving' | 'stable' | 'declining';
  }[];
  recentReports: any[];
  upcomingEvents: {
    type: 'assignment_due' | 'parent_meeting' | 'exam' | 'holiday';
    title: string;
    date: string;
    studentId: string;
    studentName: string;
  }[];
  // Yeni özellikler için veriler
  newFeatures: {
    videoSessions: number;
  };
}

export default function ParentDashboard() {
  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/parent/dashboard');
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600 bg-green-50';
      case 'stable': return 'text-blue-600 bg-blue-50';
      case 'declining': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPerformanceIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4" />;
      case 'stable': return <CheckCircle className="w-4 h-4" />;
      case 'declining': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

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

  if (!data) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">Veli Portalı</h1>
          <p className="text-secondary-600 mb-8">Dashboard verileri yüklenemedi</p>
          <Link href="/giris" className="btn-primary">
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-secondary-900 mb-2">
            Veli Portalı
          </h1>
          <p className="text-lg text-secondary-600">
            Hoş geldiniz, {data.parent.firstName} {data.parent.lastName}
          </p>
        </div>

        {/* Notifications */}
        {data.notifications.unread > 0 && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">
                {data.notifications.unread} okunmamış bildiriminiz var
              </span>
            </div>
          </div>
        )}

        {/* Children Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-secondary-900 mb-6">Çocuklarınız</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.childrenStats.map((child, index) => (
              <div key={child.studentId} className="card card-hover animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="card-header">
                  <h3 className="card-title flex items-center">
                    <Users className="w-5 h-5 mr-2 text-primary-600" />
                    {child.studentName}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Performance Trend */}
                    <div className={`flex items-center p-3 rounded-lg ${getPerformanceColor(child.performanceTrend)}`}>
                      {getPerformanceIcon(child.performanceTrend)}
                      <span className="ml-2 font-medium">
                        {child.performanceTrend === 'improving' && 'Gelişiyor'}
                        {child.performanceTrend === 'stable' && 'Stabil'}
                        {child.performanceTrend === 'declining' && 'Düşüyor'}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">{child.averageGrade}</div>
                        <div className="text-sm text-secondary-600">Ortalama Not</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success-600">
                          {child.assignmentsTotal > 0 ? Math.round((child.assignmentsCompleted / child.assignmentsTotal) * 100) : 0}%
                        </div>
                        <div className="text-sm text-secondary-600">Ödev Tamamlama</div>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm text-secondary-600 mb-1">
                          <span>Ödevler</span>
                          <span>{child.assignmentsCompleted}/{child.assignmentsTotal}</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill progress-primary"
                            style={{ width: `${child.assignmentsTotal > 0 ? (child.assignmentsCompleted / child.assignmentsTotal) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm text-secondary-600 mb-1">
                          <span>Hedefler</span>
                          <span>{child.goalsAchieved}/{child.goalsTotal}</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill progress-success"
                            style={{ width: `${child.goalsTotal > 0 ? (child.goalsAchieved / child.goalsTotal) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Last Activity */}
                    <div className="text-sm text-secondary-500">
                      Son aktivite: {new Date(child.lastActivity).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        {data.recentReports.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">Son Raporlar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.recentReports.map((report, index) => (
                <div key={report._id} className="card card-hover animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="card-header">
                    <h3 className="card-title flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-primary-600" />
                      {report.reportType === 'daily' && 'Günlük Rapor'}
                      {report.reportType === 'weekly' && 'Haftalık Rapor'}
                      {report.reportType === 'monthly' && 'Aylık Rapor'}
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      <div className="text-sm text-secondary-600">
                        {new Date(report.period.start).toLocaleDateString('tr-TR')} - {new Date(report.period.end).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="text-2xl font-bold text-primary-600">{report.summary.averageGrade}</div>
                      <div className="text-sm text-secondary-600">Ortalama Not</div>
                      <div className="text-sm text-secondary-600">
                        {report.summary.assignmentsCompleted}/{report.summary.assignmentsTotal} ödev tamamlandı
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {data.upcomingEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">Yaklaşan Etkinlikler</h2>
            <div className="space-y-4">
              {data.upcomingEvents.map((event, index) => (
                <div key={index} className="card card-hover animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-primary-600 mr-3" />
                        <div>
                          <div className="font-semibold text-secondary-900">{event.title}</div>
                          <div className="text-sm text-secondary-600">{event.studentName}</div>
                        </div>
                      </div>
                      <div className="text-sm text-secondary-500">
                        {new Date(event.date).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Koçluk */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-secondary-900 mb-6">Video Koçluk</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card card-hover group animate-scale-in">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-secondary-900 mb-2">Video Koçluk</h3>
                <p className="text-secondary-600 mb-4">Canlı video oturumları</p>
                <div className="text-2xl font-bold text-blue-600">{data?.newFeatures?.videoSessions || 0}</div>
                <div className="text-sm text-secondary-500">Video Oturumu</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/veli/raporlar" className="card card-hover group animate-scale-in">
            <div className="p-6 text-center">
              <FileText className="w-8 h-8 text-primary-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-secondary-900 mb-2">Raporlar</h3>
              <p className="text-sm text-secondary-600">Detaylı performans raporları</p>
            </div>
          </Link>

          <Link href="/veli/bildirimler" className="card card-hover group animate-scale-in" style={{animationDelay: '0.1s'}}>
            <div className="p-6 text-center">
              <Bell className="w-8 h-8 text-primary-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-secondary-900 mb-2">Bildirimler</h3>
              <p className="text-sm text-secondary-600">
                {data?.notifications?.unread || 0} okunmamış bildirim
              </p>
            </div>
          </Link>

          <Link href="/veli/iletisim" className="card card-hover group animate-scale-in" style={{animationDelay: '0.2s'}}>
            <div className="p-6 text-center">
              <Users className="w-8 h-8 text-primary-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-secondary-900 mb-2">İletişim</h3>
              <p className="text-sm text-secondary-600">Öğretmenlerle iletişim</p>
            </div>
          </Link>

          <Link href="/veli/ayarlar" className="card card-hover group animate-scale-in" style={{animationDelay: '0.3s'}}>
            <div className="p-6 text-center">
              <Star className="w-8 h-8 text-primary-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-secondary-900 mb-2">Ayarlar</h3>
              <p className="text-sm text-secondary-600">Hesap ayarları</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
