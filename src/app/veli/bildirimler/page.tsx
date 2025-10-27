'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  date: string;
  isRead: boolean;
}

export default function ParentNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/parent/dashboard', {
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (response.ok) {
        const result = await response.json();
        // Simulated notifications
        const fakeNotifications = [
          {
            id: '1',
            title: 'Ödev Tamamlandı',
            message: 'Çocuğunuzun matematik ödevi tamamlandı ve notlandırıldı.',
            type: 'success' as const,
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            isRead: false
          },
          {
            id: '2',
            title: 'Yaklaşan Ödev',
            message: 'Çocuğunuzun 2 gün içinde teslim etmesi gereken bir ödev var.',
            type: 'warning' as const,
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            isRead: false
          },
          {
            id: '3',
            title: 'Rapor Hazır',
            message: 'Aylık performans raporu hazırlandı.',
            type: 'info' as const,
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            isRead: true
          }
        ];
        setNotifications(fakeNotifications);
      }
    } catch (error) {
      console.error('Notifications fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Az önce';
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR');
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
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 mb-3">Bildirimler</h1>
          <p className="text-lg text-secondary-600">
            Çocuklarınızla ilgili önemli bildirimler
          </p>
        </div>
        <div className="text-sm text-secondary-600">
          {notifications.filter(n => !n.isRead).length} okunmamış bildirim
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <Bell className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-secondary-900 mb-2">Bildirim bulunmuyor</h3>
          <p className="text-secondary-600">
            Yeni bildirimler burada görüntülenecek
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 ${
                !notification.isRead ? 'ring-2 ring-primary-200' : ''
              }`}
            >
              <div className="flex items-start">
                <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-secondary-900">{notification.title}</h3>
                    <span className="text-sm text-secondary-500">{formatDate(notification.date)}</span>
                  </div>
                  <p className="text-secondary-600">{notification.message}</p>
                  {!notification.isRead && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-primary-100 text-primary-700 rounded-full">
                      Yeni
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

