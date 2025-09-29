'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Calendar, User, CheckCircle, Clock, AlertCircle, Edit3, List } from 'lucide-react';

interface Task {
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
}

interface Plan {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  tasks: Task[];
  teacherId: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function StudentPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/student/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Plans fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (plan: Plan) => {
    switch (plan.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <BookOpen className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (plan: Plan) => {
    switch (plan.status) {
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

  const getStatusColor = (plan: Plan) => {
    switch (plan.status) {
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

  const getTaskCompletionRate = (plan: Plan) => {
    if (plan.tasks.length === 0) return 0;
    const completedTasks = plan.tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / plan.tasks.length) * 100);
  };

  const filteredPlans = plans.filter(plan => {
    if (filter === 'all') return true;
    return plan.status === filter;
  });

  const isOverdue = (endDate: string) => {
    return new Date(endDate) < new Date() && !plans.find(p => p.endDate === endDate)?.status.includes('completed');
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
        <h1 className="text-2xl font-bold text-secondary-900">Planlarım</h1>
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
            Yeni Plan
          </button>
        </div>
      </div>

      {filteredPlans.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Plan bulunamadı</h3>
          <p className="mt-1 text-sm text-secondary-500">
            {filter === 'all' 
              ? 'Henüz bir plan oluşturmadınız.'
              : 'Bu kategoride plan bulunmuyor.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredPlans.map((plan) => (
            <div key={plan._id} className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(plan)}
                    <h3 className="text-lg font-medium text-secondary-900">
                      {plan.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(plan)}`}>
                      {getStatusText(plan)}
                    </span>
                    {isOverdue(plan.endDate) && plan.status !== 'completed' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Süresi Geçmiş
                      </span>
                    )}
                  </div>
                  
                  <p className="mt-2 text-sm text-secondary-600">
                    {plan.description}
                  </p>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-secondary-600 mb-2">
                      <span>Görev Tamamlanma</span>
                      <span>{getTaskCompletionRate(plan)}%</span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getTaskCompletionRate(plan)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-secondary-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Başlangıç: {new Date(plan.startDate).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Bitiş: {new Date(plan.endDate).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Öğretmen: {plan.teacherId.firstName} {plan.teacherId.lastName}
                    </div>
                    <div className="flex items-center">
                      <List className="h-4 w-4 mr-1" />
                      {plan.tasks.length} görev
                    </div>
                  </div>

                  {plan.tasks.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-secondary-900 mb-2">Görevler:</h4>
                      <div className="space-y-2">
                        {plan.tasks.slice(0, 3).map((task, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <CheckCircle 
                              className={`h-4 w-4 ${task.completed ? 'text-green-500' : 'text-secondary-300'}`} 
                            />
                            <span className={task.completed ? 'line-through text-secondary-500' : 'text-secondary-700'}>
                              {task.title}
                            </span>
                            <span className="text-secondary-400">
                              ({new Date(task.dueDate).toLocaleDateString('tr-TR')})
                            </span>
                          </div>
                        ))}
                        {plan.tasks.length > 3 && (
                          <div className="text-sm text-secondary-500">
                            +{plan.tasks.length - 3} görev daha...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setEditingPlan(plan)}
                  className="ml-4 p-2 text-secondary-400 hover:text-secondary-600"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Plan Modal */}
      {(showCreateForm || editingPlan) && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">
                {editingPlan ? 'Planı Düzenle' : 'Yeni Plan Oluştur'}
              </h3>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const planData = {
                  title: formData.get('title'),
                  description: formData.get('description'),
                  startDate: formData.get('startDate'),
                  endDate: formData.get('endDate'),
                  teacherId: formData.get('teacherId'),
                  tasks: []
                };

                try {
                  const response = await fetch('/api/student/plans', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(planData)
                  });

                  if (response.ok) {
                    fetchPlans(); // Refresh the list
                    setShowCreateForm(false);
                    setEditingPlan(null);
                  } else {
                    const error = await response.json();
                    alert(error.error || 'Plan oluşturulamadı');
                  }
                } catch (error) {
                  console.error('Plan creation error:', error);
                  alert('Plan oluşturulamadı');
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
                      defaultValue={editingPlan?.title || ''}
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
                      defaultValue={editingPlan?.description || ''}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Başlangıç Tarihi
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        defaultValue={editingPlan?.startDate ? new Date(editingPlan.startDate).toISOString().split('T')[0] : ''}
                        className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Bitiş Tarihi
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        defaultValue={editingPlan?.endDate ? new Date(editingPlan.endDate).toISOString().split('T')[0] : ''}
                        className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">
                      Öğretmen
                    </label>
                    <select
                      name="teacherId"
                      className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Öğretmen seçin</option>
                      <option value="default">Varsayılan Öğretmen</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingPlan(null);
                    }}
                    className="px-4 py-2 border border-secondary-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {editingPlan ? 'Güncelle' : 'Oluştur'}
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
