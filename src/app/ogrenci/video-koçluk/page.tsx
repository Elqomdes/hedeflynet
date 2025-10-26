'use client';

import { useState, useEffect } from 'react';
import { Video, Calendar, Clock, User, Play, Download, ExternalLink, MessageSquare } from 'lucide-react';

interface VideoSession {
  _id: string;
  title: string;
  description: string;
  teacherId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  scheduledAt: string;
  duration: number; // in minutes
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  meetingUrl?: string;
  platformUrl?: string;
  recordingUrl?: string;
  notes?: string;
  feedback?: string;
  createdAt: string;
}

interface VideoStats {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  totalHours: number;
  averageDuration: number;
  attendanceRate: number;
  teacherCount: number;
}

export default function StudentVideoCoaching() {
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [stats, setStats] = useState<VideoStats>({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    totalHours: 0,
    averageDuration: 0,
    attendanceRate: 0,
    teacherCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'ongoing' | 'completed'>('all');

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSessions = async () => {
    try {
      // Fetch sessions
      const sessionsResponse = await fetch('/api/student/video-coaching', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData);
      }

      // Fetch statistics
      const statsResponse = await fetch('/api/student/video-coaching/stats', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data || stats);
      }
    } catch (error) {
      console.error('Video sessions fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (session: VideoSession) => {
    switch (session.status) {
      case 'completed':
        return <Play className="h-5 w-5 text-green-500" />;
      case 'ongoing':
        return <Video className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <Clock className="h-5 w-5 text-red-500" />;
      default:
        return <Calendar className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (session: VideoSession) => {
    switch (session.status) {
      case 'completed':
        return 'Tamamlandı';
      case 'ongoing':
        return 'Devam Ediyor';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return 'Planlandı';
    }
  };

  const getStatusColor = (session: VideoSession) => {
    switch (session.status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    return session.status === filter;
  });

  const isUpcoming = (scheduledAt: string) => {
    return new Date(scheduledAt) > new Date();
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
        <h1 className="text-2xl font-bold text-secondary-900">Video Koçluk</h1>
        <div className="mt-4 sm:mt-0">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="block w-full sm:w-auto px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Tümü</option>
            <option value="scheduled">Planlanan</option>
            <option value="ongoing">Devam Eden</option>
            <option value="completed">Tamamlanan</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <Clock className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Toplam Saat</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.totalHours}</p>
            </div>
          </div>
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <Video className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Video oturumu bulunamadı</h3>
          <p className="mt-1 text-sm text-secondary-500">
            {filter === 'all' 
              ? 'Henüz planlanmış bir video oturumu bulunmuyor.'
              : 'Bu kategoride video oturumu bulunmuyor.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredSessions.map((session, index) => (
            <div key={session._id} className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 hover:shadow-md transition-shadow animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getStatusIcon(session)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-secondary-900">
                        {session.title}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session)}`}>
                          {getStatusText(session)}
                        </span>
                        {isUpcoming(session.scheduledAt) && session.status === 'scheduled' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Yaklaşıyor
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="mt-2 text-sm text-secondary-600">
                    {session.description}
                  </p>
                  
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-secondary-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Tarih: {new Date(session.scheduledAt).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Saat: {new Date(session.scheduledAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Öğretmen: {session.teacherId.firstName} {session.teacherId.lastName}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Süre: {session.duration} dakika
                    </div>
                  </div>

                  {(session.meetingUrl || session.platformUrl) && (session.status === 'ongoing' || session.status === 'scheduled') && (
                    <div className="mt-4">
                      <a
                        href={session.platformUrl || session.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                      >
                        <Video className="h-5 w-5 mr-2" />
                        Oturuma Katıl
                      </a>
                    </div>
                  )}

                  {session.recordingUrl && session.status === 'completed' && (
                    <div className="mt-4">
                      <a
                        href={session.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 border border-secondary-300 rounded-lg shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Kaydı İndir
                      </a>
                    </div>
                  )}

                  {session.notes && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <h4 className="text-sm font-medium text-secondary-900 mb-1 flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Oturum Notları:
                      </h4>
                      <p className="text-sm text-secondary-700 whitespace-pre-wrap">{session.notes}</p>
                    </div>
                  )}

                  {session.feedback && (
                    <div className="mt-4 p-3 bg-green-50 rounded-md">
                      <h4 className="text-sm font-medium text-secondary-900 mb-1 flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Öğretmen Geri Bildirimi:
                      </h4>
                      <p className="text-sm text-secondary-700 whitespace-pre-wrap">{session.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Sessions Alert */}
      {sessions.filter(session => isUpcoming(session.scheduledAt) && session.status === 'scheduled').length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Yaklaşan Video Oturumları
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  {sessions.filter(session => isUpcoming(session.scheduledAt) && session.status === 'scheduled').length} 
                  {' '}oturum yaklaşıyor. Oturum saatlerini kontrol etmeyi unutmayın.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
