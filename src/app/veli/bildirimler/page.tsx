'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  date: string;
  isRead: boolean;
  priority?: 'low' | 'medium' | 'high';
  studentName?: string;
}

export default function ParentNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/parent/notifications', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      
      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data.notifications || []);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Notifications fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setMarkingAsRead(notificationId);
    try {
      const response = await fetch(`/api/parent/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
      } else {
        console.error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAllAsRead(true);
    try {
      const response = await fetch('/api/parent/notifications/read-all', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        // Update all notifications to read
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } else {
        console.error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
    } finally {
      setMarkingAllAsRead(false);
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 sm:mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary-900 mb-2 sm:mb-3">Bildirimler</h1>
            <p className="text-sm sm:text-base lg:text-lg text-secondary-600">
              Çocuklarınızla ilgili önemli bildirimler
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAllAsRead}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 min-h-[44px] touch-manipulation w-full sm:w-auto justify-center"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                {markingAllAsRead ? 'İşleniyor...' : 'Tümünü Okundu İşaretle'}
              </button>
            )}
            <div className="text-sm text-secondary-600 font-medium">
              {unreadCount} okunmamış bildirim
            </div>
          </div>
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
        <div className="space-y-3 sm:space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer ${
                !notification.isRead ? 'ring-2 ring-primary-200 bg-primary-50/30' : ''
              }`}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${getTypeColor(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1 sm:gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-secondary-900">{notification.title}</h3>
                      {!notification.isRead && (
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-700 rounded-full whitespace-nowrap">
                          Yeni
                        </span>
                      )}
                      {notification.priority === 'high' && (
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full whitespace-nowrap">
                          Önemli
                        </span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm text-secondary-500 whitespace-nowrap">
                      {formatDate(notification.date)}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-secondary-600 mb-2">{notification.message}</p>
                  {notification.studentName && (
                    <p className="text-xs sm:text-sm text-secondary-500 flex items-center gap-1">
                      <span>Öğrenci:</span>
                      <span className="font-medium">{notification.studentName}</span>
                    </p>
                  )}
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      disabled={markingAsRead === notification.id}
                      className="mt-3 inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 min-h-[36px] touch-manipulation"
                    >
                      {markingAsRead === notification.id ? (
                        'İşleniyor...'
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Okundu Olarak İşaretle
                        </>
                      )}
                    </button>
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

