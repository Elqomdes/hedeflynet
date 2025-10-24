'use client';

import { useState, useEffect } from 'react';
import { Plus, BookOpen, Calendar, CheckCircle, Clock, AlertCircle, Target } from 'lucide-react';

interface Plan {
  _id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  category: 'academic' | 'behavioral' | 'skill' | 'personal' | 'other';
  priority: 'low' | 'medium' | 'high';
  successCriteria: string;
  createdAt: string;
  updatedAt: string;
}

export default function StudentPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    targetDate: '',
    category: 'academic' as const,
    priority: 'medium' as const,
    successCriteria: ''
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/student/plans');
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/student/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPlan),
      });
      
      const data = await response.json();
      if (data.success) {
        setPlans([data.plan, ...plans]);
        setNewPlan({
          title: '',
          description: '',
          targetDate: '',
          category: 'academic',
          priority: 'medium',
          successCriteria: ''
        });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const updatePlanProgress = async (planId: string, progress: number) => {
    try {
      const response = await fetch(`/api/student/goals/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress }),
      });
      
      const data = await response.json();
      if (data.success) {
        setPlans(plans.map(plan => 
          plan._id === planId 
            ? { ...plan, progress, status: progress === 100 ? 'completed' : 'in_progress' }
            : plan
        ));
      }
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <BookOpen className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Çalışma Planlarım</h1>
          <p className="text-secondary-600">Akademik planlarınızı oluşturun ve takip edin</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Yeni Plan
        </button>
      </div>

      {/* Create Plan Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Yeni Çalışma Planı Oluştur</h3>
          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Plan Başlığı
                </label>
                <input
                  type="text"
                  value={newPlan.title}
                  onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Örn: Matematik çalışma planı"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Hedef Tarihi
                </label>
                <input
                  type="date"
                  value={newPlan.targetDate}
                  onChange={(e) => setNewPlan({ ...newPlan, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Plan Açıklaması
              </label>
              <textarea
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Bu planla neyi başarmak istiyorsunuz?"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Kategori
                </label>
                <select
                  value={newPlan.category}
                  onChange={(e) => setNewPlan({ ...newPlan, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="academic">Akademik</option>
                  <option value="skill">Beceri</option>
                  <option value="personal">Kişisel</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Öncelik
                </label>
                <select
                  value={newPlan.priority}
                  onChange={(e) => setNewPlan({ ...newPlan, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Başarı Kriterleri
              </label>
              <textarea
                value={newPlan.successCriteria}
                onChange={(e) => setNewPlan({ ...newPlan, successCriteria: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={2}
                placeholder="Bu planı nasıl başarılı sayacağız?"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Plan Oluştur
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-secondary-200 text-secondary-700 px-4 py-2 rounded-lg hover:bg-secondary-300"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans List */}
      <div className="space-y-4">
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Henüz plan yok</h3>
            <p className="text-secondary-600 mb-4">İlk çalışma planınızı oluşturmak için yukarıdaki butona tıklayın</p>
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan._id} className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(plan.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900">{plan.title}</h3>
                    <p className="text-secondary-600">{plan.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                    {plan.status === 'completed' ? 'Tamamlandı' : 
                     plan.status === 'in_progress' ? 'Devam Ediyor' :
                     plan.status === 'cancelled' ? 'İptal Edildi' : 'Beklemede'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(plan.priority)}`}>
                    {plan.priority === 'high' ? 'Yüksek' : 
                     plan.priority === 'medium' ? 'Orta' : 'Düşük'} Öncelik
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-secondary-700">Hedef Tarihi</label>
                  <p className="text-secondary-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(plan.targetDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700">Kategori</label>
                  <p className="text-secondary-900">
                    {plan.category === 'academic' ? 'Akademik' :
                     plan.category === 'skill' ? 'Beceri' :
                     plan.category === 'personal' ? 'Kişisel' : 'Diğer'}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-secondary-700">Başarı Kriterleri</label>
                <p className="text-secondary-900">{plan.successCriteria}</p>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-secondary-700">İlerleme</label>
                  <span className="text-sm text-secondary-600">{plan.progress}%</span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${plan.progress}%` }}
                  ></div>
                </div>
                {plan.status !== 'completed' && plan.status !== 'cancelled' && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => updatePlanProgress(plan._id, Math.min(plan.progress + 25, 100))}
                      className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded hover:bg-primary-200"
                    >
                      +25%
                    </button>
                    <button
                      onClick={() => updatePlanProgress(plan._id, 100)}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                    >
                      Tamamla
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
