'use client';

import { useState, useEffect } from 'react';
import { Target, Calendar, User, CheckCircle, Clock, AlertCircle, BookOpen, Users, Zap, Star, Link } from 'lucide-react';
import WeekCalendar from '@/components/WeekCalendar';

interface Goal {
  _id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  category: 'academic' | 'behavioral' | 'skill' | 'personal' | 'other';
  priority: 'low' | 'medium' | 'high';
  assignmentId?: {
    _id: string;
    title: string;
    dueDate: string;
  };
  successCriteria: string;
  teacherId: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function StudentGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  // Students cannot create or edit goals

  useEffect(() => {
    fetchGoals();
  }, []);

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
      } else {
        console.error('Goals fetch failed:', response.status);
        setGoals([]);
      }
    } catch (error) {
      console.error('Goals fetch error:', error);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (goal: Goal) => {
    switch (goal.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Target className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (goal: Goal) => {
    switch (goal.status) {
      case 'completed':
        return 'Tamamlandı';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return 'Bekliyor';
    }
  };

  const getStatusColor = (goal: Goal) => {
    switch (goal.status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic':
        return <BookOpen className="h-4 w-4" />;
      case 'behavioral':
        return <Users className="h-4 w-4" />;
      case 'skill':
        return <Zap className="h-4 w-4" />;
      case 'personal':
        return <Star className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'academic':
        return 'Akademik';
      case 'behavioral':
        return 'Davranışsal';
      case 'skill':
        return 'Beceri';
      case 'personal':
        return 'Kişisel';
      default:
        return 'Diğer';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return 'Belirtilmemiş';
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    return goal.status === filter;
  });

  const weekItems = filteredGoals.map(g => ({
    _id: g._id,
    title: g.title,
    date: new Date(g.targetDate).toISOString().split('T')[0],
    status: g.status
  }));

  const isOverdue = (targetDate: string) => {
    return new Date(targetDate) < new Date() && !goals.find(g => g.targetDate === targetDate)?.status.includes('completed');
  };

  const updateGoal = async (goalId: string, data: Partial<Pick<Goal, 'status' | 'progress'>>) => {
    try {
      const res = await fetch(`/api/student/goals/${goalId}`, {
        method: 'PATCH',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        await fetchGoals();
      } else {
        const err = await res.json();
        alert(err.error || 'Hedef güncellenemedi');
      }
    } catch (e) {
      console.error('Goal update error', e);
      alert('Hedef güncellenemedi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Hedeflerim</h1>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="block px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Tümü</option>
            <option value="pending">Bekleyen</option>
            <option value="in_progress">Devam Eden</option>
            <option value="completed">Tamamlanan</option>
          </select>
        </div>
      </div>

      <div>
        <WeekCalendar items={weekItems} readOnly emptyText="Hedef yok" />
      </div>

      {filteredGoals.length === 0 ? (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Hedef bulunamadı</h3>
          <p className="mt-1 text-sm text-secondary-500">
            {filter === 'all' 
              ? 'Henüz bir hedef belirlemediniz.'
              : 'Bu kategoride hedef bulunmuyor.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredGoals.map((goal) => (
            <div key={goal._id} className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    {getStatusIcon(goal)}
                    <h3 className="text-lg font-semibold text-secondary-900">
                      {goal.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(goal)}`}>
                      {getStatusText(goal)}
                    </span>
                    {isOverdue(goal.targetDate) && goal.status !== 'completed' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Süresi Geçmiş
                      </span>
                    )}
                  </div>

                  {/* Category and Priority */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200`}>
                      {getCategoryIcon(goal.category)}
                      <span className="ml-1">{getCategoryText(goal.category)}</span>
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(goal.priority)}`}>
                      {getPriorityText(goal.priority)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-secondary-600 mb-4">
                    {goal.description}
                  </p>

                  {/* Success Criteria */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-secondary-700 mb-1">Başarı Kriterleri:</h4>
                    <p className="text-sm text-secondary-600">{goal.successCriteria}</p>
                  </div>
                  
                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-secondary-600 mb-2">
                      <span>İlerleme</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => updateGoal(goal._id, { status: 'completed', progress: 100 })}
                        className="px-3 py-1 rounded-md text-xs bg-green-600 text-white hover:bg-green-700 transition-colors"
                        title="Tamamlandı olarak işaretle"
                      >
                        Tamamlandı
                      </button>
                      <button
                        onClick={() => updateGoal(goal._id, { status: 'in_progress' })}
                        className="px-3 py-1 rounded-md text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        title="Devam ediyor olarak işaretle"
                      >
                        Devam Ediyor
                      </button>
                      <button
                        onClick={() => updateGoal(goal._id, { status: 'pending', progress: 0 })}
                        className="px-3 py-1 rounded-md text-xs bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                        title="Bekliyor olarak işaretle"
                      >
                        Bekliyor
                      </button>
                    </div>
                  </div>

                  {/* Assignment Link */}
                  {goal.assignmentId && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center">
                        <Link className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">Bağlı Ödev:</span>
                        <span className="text-sm text-blue-700 ml-2">{goal.assignmentId.title}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(goal.targetDate).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {goal.teacherId.firstName} {goal.teacherId.lastName}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
