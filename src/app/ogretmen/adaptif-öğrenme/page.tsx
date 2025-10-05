'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart3, Users, Target, TrendingUp, BookOpen, Clock, Star, Plus, Settings } from 'lucide-react';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  type: 'video' | 'interactive' | 'assessment' | 'project';
  content: string;
  learningObjectives: string[];
  prerequisites: string[];
  estimatedTime: number;
  difficulty: number;
  tags: string[];
  isAdaptive: boolean;
  isActive: boolean;
  studentsEnrolled: number;
  completionRate: number;
  averageScore: number;
  createdAt: string;
}

interface AdaptiveStats {
  totalModules: number;
  activeModules: number;
  enrolledStudents: number;
  averageCompletionRate: number;
  averageScore: number;
  totalLearningHours: number;
  topPerformingModule: string;
  strugglingStudents: number;
}

export default function AdaptiveLearningPage() {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [stats, setStats] = useState<AdaptiveStats>({
    totalModules: 0,
    activeModules: 0,
    enrolledStudents: 0,
    averageCompletionRate: 0,
    averageScore: 0,
    totalLearningHours: 0,
    topPerformingModule: '',
    strugglingStudents: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive' | 'adaptive'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    subject: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    type: 'interactive' as 'video' | 'interactive' | 'assessment' | 'project',
    estimatedTime: 60,
    difficulty: 3,
    isAdaptive: true
  });

  const fetchAdaptiveData = useCallback(async () => {
    try {
      // Öğrenme modüllerini getir
      const modulesResponse = await fetch('/api/teacher/adaptive-learning/modules');
      if (modulesResponse.ok) {
        const modulesData = await modulesResponse.json();
        setModules(modulesData.data || []);
      }

      // Adaptif öğrenme istatistiklerini getir
      const statsResponse = await fetch('/api/teacher/adaptive-learning/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(prevStats => statsData.data || prevStats);
      }
    } catch (error) {
      console.error('Adaptive learning data fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdaptiveData();
  }, [fetchAdaptiveData]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-600 bg-green-50';
      case 'intermediate': return 'text-yellow-600 bg-yellow-50';
      case 'advanced': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <BookOpen className="w-5 h-5" />;
      case 'interactive': return <Target className="w-5 h-5" />;
      case 'assessment': return <BarChart3 className="w-5 h-5" />;
      case 'project': return <Star className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < difficulty ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/teacher/adaptive-learning/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowCreateModal(false);
          setCreateForm({
            title: '',
            description: '',
            subject: '',
            level: 'beginner',
            type: 'interactive',
            estimatedTime: 60,
            difficulty: 3,
            isAdaptive: true
          });
          fetchAdaptiveData(); // Refresh data
        }
      }
    } catch (error) {
      console.error('Create module error:', error);
    }
  };

  const filteredModules = useMemo(() => {
    return (modules || []).filter(module => {
      const filterMatch = selectedFilter === 'all' || 
        (selectedFilter === 'active' && module.isActive) ||
        (selectedFilter === 'inactive' && !module.isActive) ||
        (selectedFilter === 'adaptive' && module.isAdaptive);
      
      const subjectMatch = selectedSubject === 'all' || module.subject === selectedSubject;
      
      return filterMatch && subjectMatch;
    });
  }, [modules, selectedFilter, selectedSubject]);

  const subjects = useMemo(() => {
    return modules && modules.length > 0 ? Array.from(new Set(modules.map(m => m.subject))) : [];
  }, [modules]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 mb-3">Adaptif Öğrenme</h1>
            <p className="text-lg text-secondary-600">
              Kişiselleştirilmiş öğrenme modülleri ve adaptif içerik
            </p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Yeni Modül</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="card card-hover animate-scale-in">
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-green-500 shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Toplam Modül</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.totalModules}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-blue-500 shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Kayıtlı Öğrenci</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.enrolledStudents}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-purple-500 shadow-lg">
              <Target className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Tamamlama Oranı</p>
              <p className="text-3xl font-bold text-secondary-900">%{stats.averageCompletionRate}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-orange-500 shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Ortalama Puan</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.averageScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex space-x-1 bg-secondary-100 p-1 rounded-lg">
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'active', label: 'Aktif' },
            { key: 'inactive', label: 'Pasif' },
            { key: 'adaptive', label: 'Adaptif' },
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
              {filter.label}
            </button>
          ))}
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Tüm Dersler</option>
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.length === 0 ? (
          <div className="col-span-full card text-center py-12">
            <BookOpen className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">Henüz öğrenme modülü yok</h3>
            <p className="text-secondary-600 mb-6">Yeni bir öğrenme modülü oluşturmak için yukarıdaki butona tıklayın.</p>
            <button className="btn-primary">
              İlk Modülü Oluştur
            </button>
          </div>
        ) : (
          filteredModules.map((module, index) => (
            <div key={module.id} className="card card-hover animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      {getTypeIcon(module.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900">{module.title}</h3>
                      <p className="text-sm text-secondary-600">{module.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {module.isAdaptive && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                        Adaptif
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(module.level)}`}>
                      {module.level === 'beginner' && 'Başlangıç'}
                      {module.level === 'intermediate' && 'Orta'}
                      {module.level === 'advanced' && 'İleri'}
                    </span>
                  </div>
                </div>

                <p className="text-secondary-600 mb-4 line-clamp-2">{module.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-500">Zorluk</span>
                    <div className="flex items-center space-x-1">
                      {getDifficultyStars(module.difficulty)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-500">Süre</span>
                    <span className="text-secondary-900 font-medium">{module.estimatedTime} dakika</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-500">Kayıtlı Öğrenci</span>
                    <span className="text-secondary-900 font-medium">{module.studentsEnrolled}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-secondary-600">
                      <span>Tamamlama Oranı</span>
                      <span>{module.completionRate}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill progress-primary"
                        style={{ width: `${module.completionRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-secondary-600">
                      <span>Ortalama Puan</span>
                      <span>{module.averageScore}/100</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill progress-success"
                        style={{ width: `${module.averageScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors">
                      Düzenle
                    </button>
                    <button className="p-1 text-secondary-400 hover:text-secondary-600">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-secondary-500">
                    {new Date(module.createdAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Module Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Yeni Öğrenme Modülü</h3>
            <form onSubmit={handleCreateModule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Başlık</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Modül başlığı"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Açıklama</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Modül açıklaması"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Ders</label>
                  <select
                    value={createForm.subject}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Ders Seçin</option>
                    <option value="Matematik">Matematik</option>
                    <option value="Fizik">Fizik</option>
                    <option value="Kimya">Kimya</option>
                    <option value="Biyoloji">Biyoloji</option>
                    <option value="Türkçe">Türkçe</option>
                    <option value="Tarih">Tarih</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Seviye</label>
                  <select
                    value={createForm.level}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, level: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="beginner">Başlangıç</option>
                    <option value="intermediate">Orta</option>
                    <option value="advanced">İleri</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Tür</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="video">Video</option>
                    <option value="interactive">İnteraktif</option>
                    <option value="assessment">Değerlendirme</option>
                    <option value="project">Proje</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Süre (dakika)</label>
                  <input
                    type="number"
                    value={createForm.estimatedTime}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="15"
                    max="300"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Zorluk (1-5)</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={createForm.difficulty}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, difficulty: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-secondary-500 mt-1">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAdaptive"
                  checked={createForm.isAdaptive}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, isAdaptive: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="isAdaptive" className="text-sm text-secondary-700">
                  Adaptif öğrenme modülü
                </label>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-secondary-300 text-secondary-700 rounded-md hover:bg-secondary-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
