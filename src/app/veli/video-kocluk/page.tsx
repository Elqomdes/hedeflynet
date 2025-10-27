'use client';

import { useState, useEffect } from 'react';
import { Video, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface VideoSession {
  id: string;
  title: string;
  scheduledFor: string;
  duration: number;
  status: string;
  studentName: string;
}

export default function ParentVideoCoaching() {
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/parent/dashboard', {
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (response.ok) {
        const result = await response.json();
        // Simulated sessions from dashboard data
        if (result.data?.children) {
          const fakeSessions = result.data.children.flatMap((child: any, index: number) => [
            {
              id: `session-${index}-1`,
              title: 'Bire Bir Görüşme',
              scheduledFor: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString(),
              duration: 30,
              status: index === 0 ? 'scheduled' : 'completed',
              studentName: `${child.firstName} ${child.lastName}`
            }
          ]);
          setSessions(fakeSessions);
        }
      }
    } catch (error) {
      console.error('Sessions fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'scheduled':
        return 'Planlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
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
        <h1 className="text-4xl font-bold text-secondary-900 mb-3">Video Koçluk</h1>
        <p className="text-lg text-secondary-600">
          Çocuklarınızın video koçluk oturumlarını takip edin
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <Video className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-secondary-900 mb-2">Henüz oturum bulunmuyor</h3>
          <p className="text-secondary-600">
            Öğretmeniniz video oturumu planladığında burada görüntülenecek
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sessions.map((session) => (
            <div key={session.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-secondary-900">{session.title}</h3>
                    <p className="text-sm text-secondary-600">{session.studentName}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(session.status)}`}>
                  {getStatusText(session.status)}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center text-sm text-secondary-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(session.scheduledFor).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
                <div className="flex items-center text-sm text-secondary-600">
                  <Clock className="w-4 h-4 mr-2" />
                  {new Date(session.scheduledFor).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="flex items-center text-sm text-secondary-600">
                  <Video className="w-4 h-4 mr-2" />
                  {session.duration} dakika
                </div>
              </div>

              {session.status === 'scheduled' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-semibold">
                    Oturuma Katıl
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

