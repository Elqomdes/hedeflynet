'use client';

import { useState, useEffect } from 'react';
import { Video, Users, Clock, Calendar, Play, Plus, Settings, Mic, MicOff, Camera, CameraOff } from 'lucide-react';

interface VideoSession {
  id: string;
  title: string;
  description: string;
  scheduledFor: string;
  duration: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  participants: {
    id: string;
    name: string;
    role: 'teacher' | 'student';
    isActive: boolean;
  }[];
  maxParticipants: number;
  meetingUrl?: string;
  recordingUrl?: string;
}

interface VideoStats {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  totalParticipants: number;
  averageDuration: number;
  totalRecordings: number;
}

export default function VideoCoachingPage() {
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [stats, setStats] = useState<VideoStats>({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    totalParticipants: 0,
    averageDuration: 0,
    totalRecordings: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    fetchVideoData();
  }, []);

  const fetchVideoData = async () => {
    try {
      // Video oturumlarını getir
      const sessionsResponse = await fetch('/api/teacher/video-coaching/sessions');
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.data || []);
      }

      // Video istatistiklerini getir
      const statsResponse = await fetch('/api/teacher/video-coaching/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data || stats);
      }
    } catch (error) {
      console.error('Video data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/teacher/video-coaching/sessions/${sessionId}/join`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.meetingUrl) {
          window.open(data.meetingUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Join session error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-50';
      case 'in_progress': return 'text-green-600 bg-green-50';
      case 'completed': return 'text-gray-600 bg-gray-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Planlandı';
      case 'in_progress': return 'Devam Ediyor';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return 'Bilinmiyor';
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (selectedFilter === 'all') return true;
    return session.status === selectedFilter;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 mb-3">Video Koçluk</h1>
            <p className="text-lg text-secondary-600">
              Canlı video oturumları ve uzaktan eğitim
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Yeni Oturum</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="card card-hover animate-scale-in">
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-blue-500 shadow-lg">
              <Video className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Toplam Oturum</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-green-500 shadow-lg">
              <Play className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Tamamlanan</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.completedSessions}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-yellow-500 shadow-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Yaklaşan</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.upcomingSessions}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-purple-500 shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Katılımcı</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.totalParticipants}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-secondary-100 p-1 rounded-lg w-fit">
          {[
            { key: 'all', label: 'Tümü', count: sessions.length },
            { key: 'scheduled', label: 'Planlanan', count: sessions.filter(s => s.status === 'scheduled').length },
            { key: 'in_progress', label: 'Devam Eden', count: sessions.filter(s => s.status === 'in_progress').length },
            { key: 'completed', label: 'Tamamlanan', count: sessions.filter(s => s.status === 'completed').length },
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

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="card text-center py-12">
            <Video className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">Henüz video oturumu yok</h3>
            <p className="text-secondary-600 mb-6">Yeni bir video oturumu oluşturmak için yukarıdaki butona tıklayın.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              İlk Oturumu Oluştur
            </button>
          </div>
        ) : (
          filteredSessions.map((session, index) => (
            <div key={session.id} className="card card-hover animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Video className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-secondary-900">{session.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {getStatusText(session.status)}
                        </span>
                      </div>
                      <p className="text-secondary-600 mb-3">{session.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-secondary-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{new Date(session.scheduledFor).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{session.duration} dakika</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{session.participants.length}/{session.maxParticipants} katılımcı</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {session.status === 'scheduled' && (
                      <button
                        onClick={() => handleJoinSession(session.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Katıl</span>
                      </button>
                    )}
                    {session.status === 'in_progress' && (
                      <button
                        onClick={() => handleJoinSession(session.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Devam Et</span>
                      </button>
                    )}
                    {session.status === 'completed' && session.recordingUrl && (
                      <button
                        onClick={() => window.open(session.recordingUrl, '_blank')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center space-x-2"
                      >
                        <Video className="w-4 h-4" />
                        <span>Kaydı İzle</span>
                      </button>
                    )}
                    <button className="p-2 text-secondary-400 hover:text-secondary-600">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Yeni Video Oturumu</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Başlık</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Oturum başlığı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Açıklama</label>
                <textarea
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Oturum açıklaması"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Tarih</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Süre (dakika)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="60"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Maksimum Katılımcı</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="10"
                />
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
