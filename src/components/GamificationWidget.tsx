'use client';

import { useState, useEffect } from 'react';
import { Trophy, Star, Target, Zap, Award, TrendingUp, Users, Crown } from 'lucide-react';

interface GamificationStats {
  level: number;
  experience: number;
  experienceToNext: number;
  totalExperience: number;
  title: string;
  badge: string;
  achievements: {
    total: number;
    unlocked: number;
    recent: any[];
  };
  streaks: {
    study: number;
    assignment: number;
    login: number;
  };
  points: number;
  rank: number;
  nextAchievements: any[];
}

export default function GamificationWidget() {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'leaderboard'>('overview');

  useEffect(() => {
    fetchGamificationStats();
  }, []);

  const fetchGamificationStats = async () => {
    try {
      const response = await fetch('/api/student/gamification');
      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Gamification stats fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelProgress = () => {
    if (!stats) return 0;
    return (stats.experience / stats.experienceToNext) * 100;
  };

  const getLevelColor = (level: number) => {
    if (level >= 50) return 'from-purple-500 to-pink-500';
    if (level >= 30) return 'from-blue-500 to-purple-500';
    if (level >= 20) return 'from-green-500 to-blue-500';
    if (level >= 10) return 'from-yellow-500 to-green-500';
    return 'from-orange-500 to-yellow-500';
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'epic': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'rare': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'common': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
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

  if (!stats) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-primary-600" />
            Gamification
          </h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-secondary-600">Gamification verileri yüklenemedi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-primary-600" />
          Gamification
        </h3>
        <p className="text-sm text-secondary-600 mt-1">
          Seviye, rozetler ve başarılarınız
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Genel Bakış
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'achievements'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Rozetler ({stats.achievements.unlocked}/{stats.achievements.total})
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'leaderboard'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sıralama
          </button>
        </nav>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Level Progress */}
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
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
                    strokeDasharray={`${getLevelProgress() * 2.51} 251`}
                    className={`text-primary-600`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-primary-600">{stats.level}</span>
                  <span className="text-xs text-gray-600">Seviye</span>
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-2">{stats.title}</h4>
              <p className="text-gray-600 mb-4">{stats.badge}</p>
              <div className="text-sm text-gray-600">
                {stats.experience} / {stats.experienceToNext} XP
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.points}</div>
                <div className="text-sm text-blue-800">Toplam Puan</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{stats.rank}</div>
                <div className="text-sm text-green-800">Sıralama</div>
              </div>
            </div>

            {/* Streaks */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Seriler</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <Zap className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-orange-600">{stats.streaks.study}</div>
                  <div className="text-xs text-orange-800">Çalışma</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-blue-600">{stats.streaks.assignment}</div>
                  <div className="text-xs text-blue-800">Ödev</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Star className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-green-600">{stats.streaks.login}</div>
                  <div className="text-xs text-green-800">Giriş</div>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            {stats.achievements.recent.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-4">Son Rozetler</h4>
                <div className="space-y-2">
                  {stats.achievements.recent.slice(0, 3).map((achievement, index) => (
                    <div key={index} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                      <Award className="w-5 h-5 text-yellow-600 mr-3" />
                      <div className="flex-1">
                        <div className="font-medium text-yellow-800">{achievement.achievementId?.name || 'Rozet'}</div>
                        <div className="text-sm text-yellow-600">{achievement.achievementId?.description || 'Açıklama'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {stats.achievements.unlocked} / {stats.achievements.total}
              </div>
              <div className="text-gray-600">Toplam Rozet</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(stats.achievements.unlocked / stats.achievements.total) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Next Achievements */}
            {stats.nextAchievements.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-4">Yaklaşan Rozetler</h4>
                <div className="space-y-3">
                  {stats.nextAchievements.map((achievement, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <Award className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium">{achievement.achievementId?.name || 'Rozet'}</div>
                            <div className="text-sm text-gray-600">{achievement.achievementId?.description || 'Açıklama'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{achievement.progress}%</div>
                          <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                            <div 
                              className="bg-primary-600 h-1 rounded-full"
                              style={{ width: `${achievement.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="text-center">
              <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Sıralama</h4>
              <p className="text-gray-600">Diğer öğrencilerle karşılaştırın</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold">Siz</div>
                    <div className="text-sm text-gray-600">{stats.title}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-600">#{stats.rank}</div>
                  <div className="text-sm text-gray-600">{stats.points} puan</div>
                </div>
              </div>

              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Sıralama verileri yükleniyor...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
