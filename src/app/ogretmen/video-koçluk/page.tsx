'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Video, Users, Clock, Calendar, Play, Plus, Settings, Edit, X } from 'lucide-react';

interface VideoSession {
  id: string;
  title: string;
  description: string;
  teacher: {
    id: string;
    name: string;
  };
  student: {
    id: string;
    name: string;
  };
  type: 'one_on_one' | 'group' | 'class' | 'consultation';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  scheduledFor: Date;
  duration: number;
  actualDuration?: number;
  meetingUrl: string;
  meetingId: string;
  platformUrl?: string;
  participants: {
    id: string;
    name: string;
    role: 'teacher' | 'student' | 'observer';
    joinedAt?: Date;
    isActive: boolean;
  }[];
  recording: {
    url?: string;
    duration?: number;
    isAvailable: boolean;
    expiresAt?: Date;
  };
  agenda: {
    topic: string;
    duration: number;
    description?: string;
    isCompleted: boolean;
  }[];
  feedback: {
    fromUser: string;
    toUser: string;
    rating: number;
    comment: string;
    createdAt: Date;
  }[];
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
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    scheduledFor: '',
    duration: 60,
    platformUrl: '',
    selectedStudents: [] as string[]
  });
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');
  const [students, setStudents] = useState<{id: string, name: string}[]>([]);
  const [editingSession, setEditingSession] = useState<string | null>(null);

  const fetchVideoData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Video oturumlarını getir
      const sessionsResponse = await fetch('/api/teacher/video-coaching/sessions');
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.data || []);
      } else {
        console.error('Sessions fetch failed:', sessionsResponse.status);
      }

      // Video istatistiklerini getir
      const statsResponse = await fetch('/api/teacher/video-coaching/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(prevStats => statsData.data || prevStats);
      } else {
        console.error('Stats fetch failed:', statsResponse.status);
      }

      // Öğrenci listesini getir
      const studentsResponse = await fetch('/api/teacher/students');
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setStudents(studentsData.map((student: any) => ({
          id: student._id,
          name: `${student.firstName} ${student.lastName}`
        })));
      } else {
        console.error('Students fetch failed:', studentsResponse.status);
      }
    } catch (error) {
      console.error('Video data fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideoData();
  }, [fetchVideoData]);

  const handleJoinSession = async (sessionId: string, platformUrl?: string) => {
    try {
      if (platformUrl) {
        window.open(platformUrl, '_blank');
        return;
      }

      const response = await fetch(`/api/teacher/video-coaching/sessions/${sessionId}/join`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.meetingUrl) {
          window.open(data.meetingUrl, '_blank');
        } else {
          alert('Oturuma katılım başarısız: ' + (data.error || 'Bilinmeyen hata'));
        }
      } else {
        const errorData = await response.json();
        alert('Oturuma katılım başarısız: ' + (errorData.error || 'Sunucu hatası'));
      }
    } catch (error) {
      console.error('Join session error:', error);
      alert('Oturuma katılım başarısız: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (createForm.selectedStudents.length === 0) {
      alert('En az bir öğrenci seçmelisiniz');
      return;
    }

    if (!createForm.platformUrl.trim()) {
      alert('Platform linki gereklidir');
      return;
    }

    try {
      const response = await fetch('/api/teacher/video-coaching/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description,
          scheduledFor: createForm.scheduledFor,
          duration: createForm.duration,
          platformUrl: createForm.platformUrl,
          selectedStudents: createForm.selectedStudents
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowCreateModal(false);
          setCreateForm({
            title: '',
            description: '',
            scheduledFor: '',
            duration: 60,
            platformUrl: '',
            selectedStudents: []
          });
          fetchVideoData(); // Refresh data
          alert('Video oturumu başarıyla oluşturuldu!');
        } else {
          alert('Oturum oluşturulurken hata oluştu: ' + (data.error || 'Bilinmeyen hata'));
        }
      } else {
        const errorData = await response.json();
        alert('Oturum oluşturulurken hata oluştu: ' + (errorData.error || 'Sunucu hatası'));
      }
    } catch (error) {
      console.error('Create session error:', error);
      alert('Oturum oluşturulurken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
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

  const filteredSessions = useMemo(() => {
    return (sessions || []).filter(session => {
      if (selectedFilter === 'all') return true;
      return session.status === selectedFilter;
    });
  }, [sessions, selectedFilter]);

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
            { key: 'all', label: 'Tümü', count: (sessions || []).length },
            { key: 'scheduled', label: 'Planlanan', count: (sessions || []).filter(s => s.status === 'scheduled').length },
            { key: 'in_progress', label: 'Devam Eden', count: (sessions || []).filter(s => s.status === 'in_progress').length },
            { key: 'completed', label: 'Tamamlanan', count: (sessions || []).filter(s => s.status === 'completed').length },
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
                          <span>{session.participants.length} katılımcı</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {session.student.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {session.status === 'scheduled' && (
                      <button
                        onClick={() => handleJoinSession(session.id, session.platformUrl)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Katıl</span>
                      </button>
                    )}
                    {session.status === 'in_progress' && (
                      <button
                        onClick={() => handleJoinSession(session.id, session.platformUrl)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Devam Et</span>
                      </button>
                    )}
                    {session.status === 'completed' && session.recording?.url && (
                      <button
                        onClick={() => window.open(session.recording.url, '_blank')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center space-x-2"
                      >
                        <Video className="w-4 h-4" />
                        <span>Kaydı İzle</span>
                      </button>
                    )}
                    <button 
                      onClick={() => setEditingSession(session.id)}
                      className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors"
                      title="Ayarlar"
                    >
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
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Başlık</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Oturum başlığı"
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
                  placeholder="Oturum açıklaması"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Tarih</label>
                  <input
                    type="datetime-local"
                    value={createForm.scheduledFor}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, scheduledFor: e.target.value }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Süre (dakika)</label>
                  <input
                    type="number"
                    value={createForm.duration}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="60"
                    min="15"
                    max="240"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Platform Linki</label>
                <input
                  type="url"
                  value={createForm.platformUrl}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, platformUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Katılımcı Öğrenciler</label>
                <div className="max-h-40 overflow-y-auto border border-secondary-300 rounded-md p-2">
                  {students.map((student) => (
                    <label key={student.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={createForm.selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCreateForm(prev => ({
                              ...prev,
                              selectedStudents: [...prev.selectedStudents, student.id]
                            }));
                          } else {
                            setCreateForm(prev => ({
                              ...prev,
                              selectedStudents: prev.selectedStudents.filter(id => id !== student.id)
                            }));
                          }
                        }}
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-secondary-700">{student.name}</span>
                    </label>
                  ))}
                </div>
                {createForm.selectedStudents.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">En az bir öğrenci seçmelisiniz</p>
                )}
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

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">Oturum Ayarları</h3>
              <button
                onClick={() => setEditingSession(null)}
                className="p-1 text-secondary-400 hover:text-secondary-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-secondary-700 mb-2">Oturum Durumu</p>
                <div className="flex space-x-2">
                  {['scheduled', 'in_progress', 'completed', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={async () => {
                        try {
                          await fetch(`/api/teacher/video-coaching/sessions/${editingSession}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status })
                          });
                          setEditingSession(null);
                          fetchVideoData();
                          alert('Oturum durumu güncellendi');
                        } catch (error) {
                          console.error('Update session error:', error);
                          alert('Oturum güncellenirken hata oluştu');
                        }
                      }}
                      className="px-3 py-2 text-sm rounded-md bg-secondary-100 text-secondary-700 hover:bg-secondary-200"
                    >
                      {getStatusText(status)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setEditingSession(null)}
                  className="flex-1 px-4 py-2 border border-secondary-300 text-secondary-700 rounded-md hover:bg-secondary-50 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
