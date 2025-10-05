'use client';

import { useState, useEffect, useCallback } from 'react';
import { Award, Trophy, Star, Users, TrendingUp, Plus, Settings } from 'lucide-react';

interface GamificationStats {
  totalPoints: number;
  totalBadges: number;
  activeStudents: number;
  averageLevel: number;
  topPerformer: string;
  recentAchievements: number;
  leaderboardPosition: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: 'academic' | 'social' | 'streak' | 'special';
  earnedBy: number;
  totalStudents: number;
}

interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  points: number;
  level: number;
  badges: number;
}

export default function GamificationPage() {
  const [stats, setStats] = useState<GamificationStats>({
    totalPoints: 0,
    totalBadges: 0,
    activeStudents: 0,
    averageLevel: 0,
    topPerformer: '',
    recentAchievements: 0,
    leaderboardPosition: 0
  });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGamificationData = useCallback(async () => {
    try {
      // Gamification istatistiklerini getir
      const statsResponse = await fetch('/api/teacher/gamification/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(prevStats => statsData.data || prevStats);
      }

      // Rozetleri getir
      const badgesResponse = await fetch('/api/teacher/gamification/badges');
      if (badgesResponse.ok) {
        const badgesData = await badgesResponse.json();
        setBadges(badgesData.data || []);
      }

      // Liderlik tablosunu getir
      const leaderboardResponse = await fetch('/api/teacher/gamification/leaderboard');
      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json();
        setLeaderboard(leaderboardData.data || []);
      }
    } catch (error) {
      console.error('Gamification data fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGamificationData();
  }, [fetchGamificationData]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'text-blue-600 bg-blue-50';
      case 'social': return 'text-green-600 bg-green-50';
      case 'streak': return 'text-orange-600 bg-orange-50';
      case 'special': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'academic': return 'Akademik';
      case 'social': return 'Sosyal';
      case 'streak': return 'Seri';
      case 'special': return 'Özel';
      default: return 'Diğer';
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
    <div className="animate-fade-in">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-secondary-900 mb-3">Gamification Sistemi</h1>
        <p className="text-lg text-secondary-600">
          Puan, rozet ve seviye sistemi ile öğrenci motivasyonu
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="card card-hover animate-scale-in">
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-yellow-500 shadow-lg">
              <Star className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Toplam Puan</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.totalPoints.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-purple-500 shadow-lg">
              <Award className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Toplam Rozet</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.totalBadges}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-green-500 shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Aktif Öğrenci</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.activeStudents}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-blue-500 shadow-lg">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Ortalama Seviye</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.averageLevel}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Leaderboard */}
        <div className="card animate-slide-up">
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
              Liderlik Tablosu
            </h3>
          </div>
          <div className="space-y-4">
            {(leaderboard || []).slice(0, 10).map((entry, index) => (
              <div key={entry.studentId} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                    entry.rank === 2 ? 'bg-gray-100 text-gray-800' :
                    entry.rank === 3 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {entry.rank}
                  </div>
                  <div>
                    <p className="font-semibold text-secondary-900">{entry.studentName}</p>
                    <p className="text-sm text-secondary-600">Seviye {entry.level} • {entry.badges} rozet</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-secondary-900">{entry.points.toLocaleString()}</p>
                  <p className="text-sm text-secondary-600">puan</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="card animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <Star className="w-5 h-5 mr-2 text-green-600" />
              Son Başarılar
            </h3>
          </div>
          <div className="space-y-4">
            <div className="text-center py-8">
              <Trophy className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-secondary-900 mb-2">Bu Hafta {stats.recentAchievements} Başarı</h4>
              <p className="text-secondary-600">Öğrenciler bu hafta toplam {stats.recentAchievements} rozet kazandı!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary-900">Rozetler</h2>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Yeni Rozet</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(badges || []).map((badge, index) => (
            <div key={badge.id} className="card card-hover animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">{badge.name}</h3>
                <p className="text-secondary-600 mb-4">{badge.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-500">Kategori</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(badge.category)}`}>
                      {getCategoryText(badge.category)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-500">Puan</span>
                    <span className="text-secondary-900 font-medium">{badge.points}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-500">Kazanan</span>
                    <span className="text-secondary-900 font-medium">{badge.earnedBy}/{badge.totalStudents}</span>
                  </div>
                  <div className="progress-bar mt-2">
                    <div 
                      className="progress-fill progress-yellow"
                      style={{ width: `${(badge.earnedBy / badge.totalStudents) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
