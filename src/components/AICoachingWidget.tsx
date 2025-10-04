'use client';

import { useState, useEffect } from 'react';
import { Brain, Target, TrendingUp, Clock, Star, CheckCircle, AlertCircle } from 'lucide-react';

interface AIRecommendation {
  id: string;
  type: 'study_plan' | 'assignment_focus' | 'goal_adjustment' | 'motivation' | 'skill_development';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionRequired: boolean;
  estimatedImpact: number;
  category: string;
  createdAt: string;
  expiresAt?: string;
}

interface StudySchedule {
  dailySchedule: {
    time: string;
    subject: string;
    duration: number;
    activity: string;
  }[];
  weeklyGoals: string[];
  tips: string[];
}

interface SuccessPrediction {
  successProbability: number;
  keyFactors: string[];
  recommendations: string[];
}

interface AICoachingData {
  recommendations: AIRecommendation[];
  studySchedule: StudySchedule;
  successPrediction: SuccessPrediction;
  stats: {
    totalAssignments: number;
    completedAssignments: number;
    totalGoals: number;
    completedGoals: number;
  };
}

export default function AICoachingWidget() {
  const [data, setData] = useState<AICoachingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'schedule' | 'prediction'>('recommendations');

  useEffect(() => {
    fetchAICoachingData();
  }, []);

  const fetchAICoachingData = async () => {
    try {
      const response = await fetch('/api/student/ai-coaching');
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('AI Coaching data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationAction = async (recommendationId: string, action: string) => {
    try {
      await fetch('/api/student/ai-coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          recommendationId
        })
      });
      // Refresh data
      fetchAICoachingData();
    } catch (error) {
      console.error('Recommendation action error:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="card-header">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center">
            <Brain className="w-5 h-5 mr-2 text-primary-600" />
            AI Koçluk Sistemi
          </h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-secondary-600">AI koçluk verileri yüklenemedi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center">
          <Brain className="w-5 h-5 mr-2 text-primary-600" />
          AI Koçluk Sistemi
        </h3>
        <p className="text-sm text-secondary-600 mt-1">
          Kişiselleştirilmiş öneriler ve çalışma planları
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recommendations'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Öneriler ({data.recommendations.length})
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedule'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Çalışma Planı
          </button>
          <button
            onClick={() => setActiveTab('prediction')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'prediction'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Başarı Tahmini
          </button>
        </nav>
      </div>

      <div className="p-6">
        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {data.recommendations.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Henüz öneri bulunmuyor</p>
              </div>
            ) : (
              data.recommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className={`p-4 rounded-xl border-2 ${getPriorityColor(recommendation.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {getPriorityIcon(recommendation.priority)}
                        <h4 className="font-semibold ml-2">{recommendation.title}</h4>
                        <span className="ml-2 px-2 py-1 text-xs rounded-full bg-white/50">
                          {recommendation.category}
                        </span>
                      </div>
                      <p className="text-sm mb-3">{recommendation.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs">
                          <span>Etki: {recommendation.estimatedImpact}/10</span>
                          <span>Öncelik: {recommendation.priority}</span>
                        </div>
                        {recommendation.actionRequired && (
                          <button
                            onClick={() => handleRecommendationAction(recommendation.id, 'mark_completed')}
                            className="px-3 py-1 bg-white/50 rounded-lg text-xs font-medium hover:bg-white/70 transition-colors"
                          >
                            Tamamlandı
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Study Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-lg mb-4">Günlük Çalışma Programı</h4>
              <div className="space-y-3">
                {data.studySchedule.dailySchedule.map((schedule, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-20 text-sm font-medium text-gray-600">{schedule.time}</div>
                    <div className="flex-1 ml-4">
                      <div className="font-medium">{schedule.subject}</div>
                      <div className="text-sm text-gray-600">{schedule.activity}</div>
                    </div>
                    <div className="text-sm text-gray-500">{schedule.duration} dk</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Haftalık Hedefler</h4>
              <ul className="space-y-2">
                {data.studySchedule.weeklyGoals.map((goal, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Çalışma İpuçları</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.studySchedule.tips.map((tip, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Success Prediction Tab */}
        {activeTab === 'prediction' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 relative">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${data.successPrediction.successProbability * 2.51} 251`}
                    className="text-primary-600"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-600">
                    {data.successPrediction.successProbability}%
                  </span>
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-2">Başarı Olasılığı</h4>
              <p className="text-gray-600">Mevcut performansınıza göre tahmin edilen başarı oranı</p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Güçlü Yönleriniz</h4>
              <div className="space-y-2">
                {data.successPrediction.keyFactors.map((factor, index) => (
                  <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-sm text-green-800">{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Gelişim Önerileri</h4>
              <div className="space-y-2">
                {data.successPrediction.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                    <Target className="w-4 h-4 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
