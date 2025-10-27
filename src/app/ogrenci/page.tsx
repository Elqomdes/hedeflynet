'use client';

import { useState, useEffect } from 'react';
import { FileText, Target, BookOpen, CheckCircle, Calendar, Clock, Star, TrendingUp, Award, BookOpenCheck, Users, Zap, Video, Inbox, Settings, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import WeekCalendar from '@/components/WeekCalendar';


interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  type: 'individual' | 'class';
  maxGrade?: number;
  submission?: {
    status: 'pending' | 'submitted' | 'completed' | 'late' | 'graded';
    grade?: number;
  };
}

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    totalAssignments: 0,
    completedAssignments: 0,
    submittedAssignments: 0,
    gradedAssignments: 0,
    totalClasses: 0,
    videoSessions: 0,
    averageGrade: 0
  });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchAssignments();
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
    }
  };


  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/student/assignments', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        setAssignments(data || []);
      }
    } catch (error) {
      console.error('Assignments fetch error:', error);
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

  const submissionRate = stats.totalAssignments > 0 
    ? Math.round((stats.submittedAssignments / stats.totalAssignments) * 100)
    : 0;

  const gradingRate = stats.submittedAssignments > 0 
    ? Math.round((stats.gradedAssignments / stats.submittedAssignments) * 100)
    : 0;


  // Calendar items for assignments
  const assignmentItems = (assignments || []).map(assignment => ({
    _id: `assignment-${assignment._id}`,
    title: assignment.title,
    description: assignment.description,
    date: new Date(assignment.dueDate).toISOString().split('T')[0],
    status: assignment.submission?.status || 'pending'
  }));

  const allCalendarItems = [...assignmentItems];

  // Recent assignments (next 7 days)
  const upcomingAssignments = (assignments || [])
    .filter(assignment => {
      const dueDate = new Date(assignment.dueDate);
      const now = new Date();
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);


  const statCards = [
    {
      name: 'Toplam Ödev',
      value: stats.totalAssignments,
      completed: stats.submittedAssignments,
      icon: FileText,
      color: 'bg-blue-500',
      href: '/ogrenci/odevler',
      subtitle: `${stats.gradedAssignments} değerlendirildi`
    },
    {
      name: 'Sınıflarım',
      value: stats.totalClasses,
      completed: stats.totalClasses,
      icon: Users,
      color: 'bg-indigo-500',
      href: '/ogrenci/siniflar',
      subtitle: 'Aktif sınıflar'
    },
    {
      name: 'Video Koçluk',
      value: stats.videoSessions,
      completed: stats.videoSessions,
      icon: Video,
      color: 'bg-teal-500',
      href: '/ogrenci/video-koçluk',
      subtitle: 'Video oturumu'
    },
    {
      name: 'Ortalama Not',
      value: stats.averageGrade > 0 ? stats.averageGrade.toFixed(1) : 'N/A',
      completed: stats.averageGrade,
      icon: Star,
      color: 'bg-yellow-500',
      href: '/ogrenci/analiz',
      subtitle: 'Genel performans'
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-secondary-900 mb-3">Öğrenci Dashboard</h1>
        <p className="text-lg text-secondary-600">
          Ödevlerinizi takip edin ve ilerlemenizi görün
        </p>
      </div>

      {/* Calendar Section */}
      <div className="mb-10">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Haftalık Takvim
            </h3>
            <p className="text-sm text-secondary-600">Hedefleriniz ve ödevleriniz</p>
          </div>
          <div className="p-6">
            <WeekCalendar 
              items={allCalendarItems} 
              readOnly 
              emptyText="Bu hafta için etkinlik yok" 
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-secondary-900 mb-6">Hızlı Erişim</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/ogrenci/odevler" className="group animate-scale-in">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors duration-300">Ödevlerim</h3>
                <p className="text-secondary-600 mb-2">Ödevlerinizi görüntüleyin ve teslim edin</p>
                <div className="text-2xl font-bold text-blue-600">{stats.totalAssignments}</div>
                <div className="text-sm text-secondary-500">Toplam Ödev</div>
              </div>
            </div>
          </Link>

          <Link href="/ogrenci/teslimler" className="group animate-scale-in" style={{animationDelay: '0.1s'}}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                  <Inbox className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors duration-300">Teslimlerim</h3>
                <p className="text-secondary-600 mb-2">Teslim ettiğiniz ödevleri görüntüleyin</p>
                <div className="text-2xl font-bold text-green-600">{stats.submittedAssignments}</div>
                <div className="text-sm text-secondary-500">Teslim Edilen</div>
              </div>
            </div>
          </Link>

          <Link href="/ogrenci/video-koçluk" className="group animate-scale-in" style={{animationDelay: '0.2s'}}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors duration-300">Video Koçluk</h3>
                <p className="text-secondary-600 mb-2">Video oturumlarınızı takip edin</p>
                <div className="text-2xl font-bold text-teal-600">{stats.videoSessions}</div>
                <div className="text-sm text-secondary-500">Video Oturumu</div>
              </div>
            </div>
          </Link>

          <Link href="/ogrenci/profil" className="group animate-scale-in" style={{animationDelay: '0.3s'}}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors duration-300">Profilim</h3>
                <p className="text-secondary-600 mb-2">Profil bilgilerinizi düzenleyin</p>
                <div className="text-2xl font-bold text-purple-600">⚙️</div>
                <div className="text-sm text-secondary-500">Ayarlar</div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="card card-hover animate-scale-in">
          <div className="card-header">
            <h3 className="card-title">
              Ödev Teslim Oranı
            </h3>
          </div>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-secondary-600 mb-3">
                <span>Teslim Edilen</span>
                <span className="font-semibold">{stats.submittedAssignments}/{stats.totalAssignments}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill progress-primary"
                  style={{ width: `${submissionRate}%` }}
                ></div>
              </div>
              <p className="text-sm text-secondary-600 mt-3">
                %{submissionRate} teslim edildi
              </p>
            </div>
            <div className="ml-6 text-4xl font-bold text-primary-600">
              {submissionRate}%
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.1s'}}>
          <div className="card-header">
            <h3 className="card-title">
              Değerlendirme Oranı
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
                  className="progress-fill progress-success"
                  style={{ width: `${gradingRate}%` }}
                ></div>
              </div>
              <p className="text-sm text-secondary-600 mt-3">
                %{gradingRate} değerlendirildi
              </p>
            </div>
            <div className="ml-6 text-4xl font-bold text-success-600">
              {gradingRate}%
            </div>
          </div>
        </div>

      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {statCards.map((stat, index) => (
          <Link key={stat.name} href={stat.href} className="card card-hover group animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
            <div className="flex items-center">
              <div className={`p-4 rounded-2xl ${stat.color} shadow-lg group-hover:shadow-glow transition-all duration-300`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-6 flex-1">
                <p className="text-sm font-semibold text-secondary-600 mb-1">{stat.name}</p>
                <p className="text-3xl font-bold text-secondary-900 mb-1">{stat.value}</p>
                <p className="text-sm text-secondary-500">
                  {stat.subtitle}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>


      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="card animate-slide-up">
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Yaklaşan Ödevler
            </h3>
          </div>
          <div className="space-y-3">
            {upcomingAssignments.length === 0 ? (
              <div className="text-center py-4">
                <FileText className="h-8 w-8 text-secondary-400 mx-auto mb-2" />
                <p className="text-sm text-secondary-500">Yaklaşan ödev yok</p>
              </div>
            ) : (
              upcomingAssignments.map((assignment) => (
                <div key={assignment._id} className="flex items-center p-3 bg-blue-50 rounded-xl">
                  <FileText className="h-5 w-5 text-primary-600 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-secondary-900">{assignment.title}</p>
                    <p className="text-xs text-secondary-600">
                      Teslim: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    assignment.submission?.status === 'submitted' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {assignment.submission?.status === 'submitted' ? 'Teslim Edildi' : 'Bekliyor'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>


        <div className="card animate-slide-up" style={{animationDelay: '0.2s'}}>
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Hızlı Erişim
            </h3>
          </div>
          <div className="space-y-3">
            <Link
              href="/ogrenci/odevler"
              className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 group"
            >
              <div className="p-2 bg-primary-500 rounded-lg group-hover:bg-primary-600 transition-colors duration-300">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="font-semibold text-secondary-900 text-sm">Ödevlerim</p>
                <p className="text-xs text-secondary-600">
                  {stats.totalAssignments} ödev
                </p>
              </div>
            </Link>
            <Link
              href="/ogrenci/analiz"
              className="flex items-center p-3 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all duration-300 group"
            >
              <div className="p-2 bg-orange-500 rounded-lg group-hover:bg-orange-600 transition-colors duration-300">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="font-semibold text-secondary-900 text-sm">Analizim</p>
                <p className="text-xs text-secondary-600">
                  Performans raporu
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
