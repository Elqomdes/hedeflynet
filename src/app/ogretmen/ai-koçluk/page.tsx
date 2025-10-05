'use client';

import { useState, useEffect } from 'react';
import { Brain, Users, TrendingUp, Target, Lightbulb, BarChart3, Clock, Star } from 'lucide-react';

interface AIRecommendation {
  id: string;
  studentId: string;
  studentName: string;
  type: 'study_plan' | 'motivation' | 'difficulty' | 'schedule';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  status: 'pending' | 'applied' | 'dismissed';
}

interface AIStats {
  totalRecommendations: number;
  appliedRecommendations: number;
  pendingRecommendations: number;
  successRate: number;
  topPerformingStudents: number;
  averageResponseTime: number;
}

export default function AICoachingPage() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [stats, setStats] = useState<AIStats>({
    totalRecommendations: 0,
    appliedRecommendations: 0,
    pendingRecommendations: 0,
    successRate: 0,
    topPerformingStudents: 0,
    averageResponseTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'applied' | 'dismissed'>('all');

  useEffect(() => {
    fetchAIData();
  }, []);

  const fetchAIData = async () => {
    try {
      // AI önerilerini getir
      const recommendationsResponse = await fetch('/api/teacher/ai-coaching/recommendations');
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        setRecommendations(recommendationsData.data || []);
      }

      // AI istatistiklerini getir
      const statsResponse = await fetch('/api/teacher/ai-coaching/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data || stats);
      }
    } catch (error) {
      console.error('AI data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationAction = async (recommendationId: string, action: 'apply' | 'dismiss') => {
    try {
      const response = await fetch(`/api/teacher/ai-coaching/recommendations/${recommendationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // Öneriyi güncelle
        setRecommendations(prev => 
          prev.map(rec => 
            rec.id === recommendationId 
              ? { ...rec, status: action === 'apply' ? 'applied' : 'dismissed' }
              : rec
          )
        );
        // İstatistikleri yenile
        fetchAIData();
      }
    } catch (error) {
      console.error('Recommendation action error:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'study_plan': return <Target className="w-5 h-5" />;
      case 'motivation': return <Lightbulb className="w-5 h-5" />;
      case 'difficulty': return <TrendingUp className="w-5 h-5" />;
      case 'schedule': return <Clock className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const filteredRecommendations = (recommendations || []).filter(rec => {
    if (selectedFilter === 'all') return true;
    return rec.status === selectedFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-secondary-900 mb-3">AI Koçluk Sistemi</h1>
        <p className="text-lg text-secondary-600">
          Yapay zeka destekli öğrenci koçluğu ve kişiselleştirilmiş öneriler
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="card card-hover animate-scale-in">
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-purple-500 shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Toplam Öneri</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.totalRecommendations}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-green-500 shadow-lg">
              <Target className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Uygulanan</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.appliedRecommendations}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-yellow-500 shadow-lg">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Bekleyen</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.pendingRecommendations}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-blue-500 shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Başarı Oranı</p>
              <p className="text-3xl font-bold text-secondary-900">%{stats.successRate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-secondary-100 p-1 rounded-lg w-fit">
          {[
            { key: 'all', label: 'Tümü', count: (recommendations || []).length },
            { key: 'pending', label: 'Bekleyen', count: (recommendations || []).filter(r => r.status === 'pending').length },
            { key: 'applied', label: 'Uygulanan', count: (recommendations || []).filter(r => r.status === 'applied').length },
            { key: 'dismissed', label: 'Reddedilen', count: (recommendations || []).filter(r => r.status === 'dismissed').length },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedFilter === filter.key
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.length === 0 ? (
          <div className="card text-center py-12">
            <Brain className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">Henüz AI önerisi yok</h3>
            <p className="text-secondary-600">Öğrencileriniz için AI önerileri oluşturulduğunda burada görünecek.</p>
          </div>
        ) : (
          filteredRecommendations.map((recommendation, index) => (
            <div key={recommendation.id} className="card card-hover animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      {getTypeIcon(recommendation.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-secondary-900">{recommendation.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendation.priority)}`}>
                          {recommendation.priority === 'high' && 'Yüksek Öncelik'}
                          {recommendation.priority === 'medium' && 'Orta Öncelik'}
                          {recommendation.priority === 'low' && 'Düşük Öncelik'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          recommendation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          recommendation.status === 'applied' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {recommendation.status === 'pending' && 'Bekliyor'}
                          {recommendation.status === 'applied' && 'Uygulandı'}
                          {recommendation.status === 'dismissed' && 'Reddedildi'}
                        </span>
                      </div>
                      <p className="text-secondary-600 mb-3">{recommendation.description}</p>
                      <div className="flex items-center text-sm text-secondary-500">
                        <Users className="w-4 h-4 mr-1" />
                        <span className="mr-4">{recommendation.studentName}</span>
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{new Date(recommendation.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                  
                  {recommendation.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRecommendationAction(recommendation.id, 'apply')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Uygula
                      </button>
                      <button
                        onClick={() => handleRecommendationAction(recommendation.id, 'dismiss')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Reddet
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
