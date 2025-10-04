'use client';

import { useState, useEffect } from 'react';
import { FileText, Target, BookOpen, TrendingUp, CheckCircle, Clock, Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import AICoachingWidget from '@/components/AICoachingWidget';
import GamificationWidget from '@/components/GamificationWidget';
import SocialLearningWidget from '@/components/SocialLearningWidget';

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

  const submissionRate = stats.totalAssignments > 0 
    ? Math.round((stats.submittedAssignments / stats.totalAssignments) * 100)
    : 0;

  const gradingRate = stats.submittedAssignments > 0 
    ? Math.round((stats.gradedAssignments / stats.submittedAssignments) * 100)
    : 0;

  const goalCompletionRate = stats.totalGoals > 0 
    ? Math.round((stats.completedGoals / stats.totalGoals) * 100)
    : 0;

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
          Ödevlerinizi takip edin, hedeflerinize ulaşın
        </p>
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

      {/* AI Coaching and Gamification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <AICoachingWidget />
        <GamificationWidget />
      </div>

      {/* Social Learning */}
      <div className="mb-10">
        <SocialLearningWidget />
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card animate-slide-up">
          <div className="card-header">
            <h3 className="card-title">
              Son Aktiviteler
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-green-50 rounded-xl">
              <CheckCircle className="h-5 w-5 text-success-600 mr-4" />
              <span className="text-secondary-700 font-medium">Dashboard&apos;a hoş geldiniz!</span>
            </div>
            <div className="flex items-center p-3 bg-blue-50 rounded-xl">
              <FileText className="h-5 w-5 text-primary-600 mr-4" />
              <span className="text-secondary-700 font-medium">Ödevlerinizi kontrol edin</span>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-xl">
              <Target className="h-5 w-5 text-success-600 mr-4" />
              <span className="text-secondary-700 font-medium">Hedeflerinizi belirleyin</span>
            </div>
            <div className="flex items-center p-3 bg-purple-50 rounded-xl">
              <BookOpen className="h-5 w-5 text-purple-600 mr-4" />
              <span className="text-secondary-700 font-medium">Planlarınızı takip edin</span>
            </div>
          </div>
        </div>

        <div className="card animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="card-header">
            <h3 className="card-title">
              Hızlı Erişim
            </h3>
          </div>
          <div className="space-y-4">
            <Link
              href="/ogrenci/odevler"
              className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 group"
            >
              <div className="p-3 bg-primary-500 rounded-xl group-hover:bg-primary-600 transition-colors duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="font-semibold text-secondary-900">Ödevlerim</p>
                <p className="text-sm text-secondary-600">
                  {stats.totalAssignments} ödev
                </p>
              </div>
            </Link>
            <Link
              href="/ogrenci/hedefler"
              className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 group"
            >
              <div className="p-3 bg-success-500 rounded-xl group-hover:bg-success-600 transition-colors duration-300">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="font-semibold text-secondary-900">Hedeflerim</p>
                <p className="text-sm text-secondary-600">
                  {stats.totalGoals} hedef
                </p>
              </div>
            </Link>
            <Link
              href="/ogrenci/planlar"
              className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 group"
            >
              <div className="p-3 bg-purple-500 rounded-xl group-hover:bg-purple-600 transition-colors duration-300">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="font-semibold text-secondary-900">Planlarım</p>
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
