'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, User, Calendar, CheckCircle, Clock, AlertCircle, Edit3, Trash2 } from 'lucide-react';

interface Goal {
  _id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function TeacherGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchGoals();
    fetchStudents();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/teacher/goals');
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch (error) {
      console.error('Goals fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/teacher/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Students fetch error:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Bu hedefi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/goals/${goalId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setGoals(goals.filter(g => g._id !== goalId));
      }
    } catch (error) {
      console.error('Delete goal error:', error);
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

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    return goal.status === filter;
  });

  const isOverdue = (targetDate: string) => {
    return new Date(targetDate) < new Date() && !goals.find(g => g.targetDate === targetDate)?.status.includes('completed');
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
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Hedef
          </button>
        </div>
      </div>

      {filteredGoals.length === 0 ? (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Hedef bulunamadı</h3>
          <p className="mt-1 text-sm text-secondary-500">
            {filter === 'all' 
              ? 'Henüz bir hedef oluşturmadınız.'
              : 'Bu kategoride hedef bulunmuyor.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredGoals.map((goal) => (
            <div key={goal._id} className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(goal)}
                    <h3 className="text-lg font-medium text-secondary-900">
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
                  
                  <p className="mt-2 text-sm text-secondary-600">
                    {goal.description}
                  </p>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-secondary-600 mb-2">
                      <span>İlerleme</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-secondary-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Hedef Tarihi: {new Date(goal.targetDate).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Öğrenci: {goal.studentId.firstName} {goal.studentId.lastName}
                    </div>
                  </div>
                </div>
                
                <div className="ml-4 flex space-x-2">
                  <button
                    onClick={() => setEditingGoal(goal)}
                    className="p-2 text-secondary-400 hover:text-secondary-600"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal._id)}
                    className="p-2 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Goal Modal */}
      {(showCreateForm || editingGoal) && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">
                {editingGoal ? 'Hedefi Düzenle' : 'Yeni Hedef Oluştur'}
              </h3>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const goalData = {
                  title: formData.get('title'),
                  description: formData.get('description'),
                  targetDate: formData.get('targetDate'),
                  studentId: formData.get('studentId')
                };

                try {
                  const response = await fetch('/api/teacher/goals', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(goalData)
                  });

                  if (response.ok) {
                    fetchGoals(); // Refresh the list
                    setShowCreateForm(false);
                    setEditingGoal(null);
                  } else {
                    const error = await response.json();
                    alert(error.error || 'Hedef oluşturulamadı');
                  }
                } catch (error) {
                  console.error('Goal creation error:', error);
                  alert('Hedef oluşturulamadı');
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">
                      Başlık
                    </label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editingGoal?.title || ''}
                      className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">
                      Açıklama
                    </label>
                    <textarea
                      name="description"
                      defaultValue={editingGoal?.description || ''}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">
                      Öğrenci
                    </label>
                    <select
                      name="studentId"
                      defaultValue={editingGoal?.studentId._id || ''}
                      className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Öğrenci seçin</option>
                      {students.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.firstName} {student.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">
                      Hedef Tarihi
                    </label>
                    <input
                      type="date"
                      name="targetDate"
                      defaultValue={editingGoal?.targetDate ? new Date(editingGoal.targetDate).toISOString().split('T')[0] : ''}
                      className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingGoal(null);
                    }}
                    className="px-4 py-2 border border-secondary-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {editingGoal ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
