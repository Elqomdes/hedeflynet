'use client';

import { useState, useEffect } from 'react';
import { FileText, Target, BookOpen, CheckCircle, Calendar, Clock, Star, TrendingUp, Award, BookOpenCheck, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import WeekCalendar from '@/components/WeekCalendar';

interface Goal {
  _id: string;
  title: string;
  targetDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  assignments?: {
    _id: string;
    title: string;
    dueDate: string;
    type: 'individual' | 'class';
  }[];
}

interface Assignment {
  _id: string;
  title: string;
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
    totalGoals: 0,
    completedGoals: 0,
    totalPlans: 0,
    completedPlans: 0
  });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchGoals();
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

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/student/goals', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        setGoals(data || []);
      }
    } catch (error) {
      console.error('Goals fetch error:', error);
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

  const goalCompletionRate = stats.totalGoals > 0 
    ? Math.round((stats.completedGoals / stats.totalGoals) * 100)
    : 0;

  // Calendar items for goals and assignments
  const goalItems = (goals || []).map(goal => ({
    _id: goal._id,
    title: goal.title,
    date: new Date(goal.targetDate).toISOString().split('T')[0],
    status: goal.status
  }));

  const assignmentItems = (assignments || []).map(assignment => ({
    _id: `assignment-${assignment._id}`,
    title: `📝 ${assignment.title}`,
    date: new Date(assignment.dueDate).toISOString().split('T')[0],
    status: assignment.submission?.status || 'pending'
  }));

  const allCalendarItems = [...goalItems, ...assignmentItems];

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

  // Recent goals
  const recentGoals = (goals || [])
    .filter(goal => goal.status !== 'completed')
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
    .slice(0, 3);

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
      name: 'Hedeflerim',
      value: stats.totalGoals,
      completed: stats.completedGoals,
      icon: Target,
      color: 'bg-green-500',
      href: '/ogrenci/hedefler',
      subtitle: `${stats.completedGoals} tamamlandı`
    },
    {
      name: 'Planlarım',
      value: stats.totalPlans,
      completed: stats.completedPlans,
      icon: BookOpen,
      color: 'bg-purple-500',
      href: '/ogrenci/planlar',
      subtitle: `${stats.completedPlans} tamamlandı`
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-secondary-900 mb-3">Öğrenci Dashboard</h1>
        <p className="text-lg text-secondary-600">
          Ödevlerinizi takip edin, hedeflerinize ulaşın ve ilerlemenizi görün
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

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.2s'}}>
          <div className="card-header">
            <h3 className="card-title">
              Hedef Tamamlama Oranı
            </h3>
          </div>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-secondary-600 mb-3">
                <span>Tamamlanan</span>
                <span className="font-semibold">{stats.completedGoals}/{stats.totalGoals}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill progress-warning"
                  style={{ width: `${goalCompletionRate}%` }}
                ></div>
              </div>
              <p className="text-sm text-secondary-600 mt-3">
                %{goalCompletionRate} tamamlandı
              </p>
            </div>
            <div className="ml-6 text-4xl font-bold text-warning-600">
              {goalCompletionRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
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

        <div className="card animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Aktif Hedefler
            </h3>
          </div>
          <div className="space-y-3">
            {recentGoals.length === 0 ? (
              <div className="text-center py-4">
                <Target className="h-8 w-8 text-secondary-400 mx-auto mb-2" />
                <p className="text-sm text-secondary-500">Aktif hedef yok</p>
              </div>
            ) : (
              recentGoals.map((goal) => (
                <div key={goal._id} className="p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-secondary-900">{goal.title}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      goal.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : goal.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {goal.status === 'completed' ? 'Tamamlandı' : 
                       goal.status === 'in_progress' ? 'Devam Ediyor' : 'Bekliyor'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 bg-secondary-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-secondary-600">{goal.progress}%</span>
                  </div>
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
              href="/ogrenci/hedefler"
              className="flex items-center p-3 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 group"
            >
              <div className="p-2 bg-success-500 rounded-lg group-hover:bg-success-600 transition-colors duration-300">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="font-semibold text-secondary-900 text-sm">Hedeflerim</p>
                <p className="text-xs text-secondary-600">
                  {stats.totalGoals} hedef
                </p>
              </div>
            </Link>
            <Link
              href="/ogrenci/planlar"
              className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 group"
            >
              <div className="p-2 bg-purple-500 rounded-lg group-hover:bg-purple-600 transition-colors duration-300">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="font-semibold text-secondary-900 text-sm">Planlarım</p>
                <p className="text-xs text-secondary-600">
                  {stats.totalPlans} plan
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
