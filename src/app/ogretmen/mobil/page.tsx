'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Download, Users, Bell, Settings, Wifi, Shield, Plus } from 'lucide-react';

interface MobileStats {
  totalUsers: number;
  activeUsers: number;
  downloads: number;
  notificationsSent: number;
  averageSessionTime: number;
  crashRate: number;
  appVersion: string;
  lastUpdate: string;
}

interface MobileUser {
  id: string;
  name: string;
  deviceType: 'ios' | 'android';
  appVersion: string;
  lastActive: string;
  isOnline: boolean;
  notificationsEnabled: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'assignment' | 'reminder' | 'achievement' | 'general';
  sentAt: string;
  readCount: number;
  totalSent: number;
}

export default function MobilePage() {
  const [stats, setStats] = useState<MobileStats>({
    totalUsers: 0,
    activeUsers: 0,
    downloads: 0,
    notificationsSent: 0,
    averageSessionTime: 0,
    crashRate: 0,
    appVersion: '',
    lastUpdate: ''
  });
  const [users, setUsers] = useState<MobileUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMobileData();
  }, []);

  const fetchMobileData = async () => {
    try {
      // Mobil istatistiklerini getir
      const statsResponse = await fetch('/api/teacher/mobile/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data || stats);
      }

      // Mobil kullanıcıları getir
      const usersResponse = await fetch('/api/teacher/mobile/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.data || []);
      }

      // Bildirimleri getir
      const notificationsResponse = await fetch('/api/teacher/mobile/notifications');
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData.data || []);
      }
    } catch (error) {
      console.error('Mobile data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    return <Smartphone className="w-5 h-5" />;
  };

  const getDeviceColor = (deviceType: string) => {
    return deviceType === 'ios' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assignment': return <Download className="w-4 h-4" />;
      case 'reminder': return <Bell className="w-4 h-4" />;
      case 'achievement': return <Shield className="w-4 h-4" />;
      case 'general': return <Settings className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'assignment': return 'text-blue-600 bg-blue-50';
      case 'reminder': return 'text-yellow-600 bg-yellow-50';
      case 'achievement': return 'text-green-600 bg-green-50';
      case 'general': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
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
        <h1 className="text-4xl font-bold text-secondary-900 mb-3">Mobil Uygulama</h1>
        <p className="text-lg text-secondary-600">
          Mobil cihazlardan erişim ve push bildirimleri
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="card card-hover animate-scale-in">
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-blue-500 shadow-lg">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Toplam Kullanıcı</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-green-500 shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Aktif Kullanıcı</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-purple-500 shadow-lg">
              <Download className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">İndirme</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.downloads}</p>
            </div>
          </div>
        </div>

        <div className="card card-hover animate-scale-in" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center">
            <div className="p-4 rounded-2xl bg-orange-500 shadow-lg">
              <Bell className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-semibold text-secondary-600 mb-1">Bildirim</p>
              <p className="text-3xl font-bold text-secondary-900">{stats.notificationsSent}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* App Info */}
        <div className="card animate-slide-up">
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-blue-600" />
              Uygulama Bilgileri
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <span className="text-secondary-700 font-medium">Uygulama Versiyonu</span>
              <span className="text-secondary-900 font-semibold">{stats.appVersion}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <span className="text-secondary-700 font-medium">Son Güncelleme</span>
              <span className="text-secondary-900 font-semibold">{new Date(stats.lastUpdate).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <span className="text-secondary-700 font-medium">Ortalama Oturum Süresi</span>
              <span className="text-secondary-900 font-semibold">{stats.averageSessionTime} dakika</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <span className="text-secondary-700 font-medium">Çökme Oranı</span>
              <span className="text-secondary-900 font-semibold">%{stats.crashRate}</span>
            </div>
          </div>
        </div>

        {/* Device Distribution */}
        <div className="card animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <Wifi className="w-5 h-5 mr-2 text-green-600" />
              Cihaz Dağılımı
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-secondary-700 font-medium">iOS</span>
              </div>
              <span className="text-secondary-900 font-semibold">
                {Math.floor(stats.totalUsers * 0.6)} kullanıcı
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Smartphone className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-secondary-700 font-medium">Android</span>
              </div>
              <span className="text-secondary-900 font-semibold">
                {Math.floor(stats.totalUsers * 0.4)} kullanıcı
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Users */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary-900">Mobil Kullanıcılar</h2>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Kullanıcı Ekle</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(users || []).map((user, index) => (
            <div key={user.id} className="card card-hover animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getDeviceIcon(user.deviceType)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900">{user.name}</h3>
                      <p className="text-sm text-secondary-600">v{user.appVersion}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDeviceColor(user.deviceType)}`}>
                      {user.deviceType.toUpperCase()}
                    </span>
                    <div className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-500">Son Aktivite</span>
                    <span className="text-secondary-900">{new Date(user.lastActive).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-500">Bildirimler</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.notificationsEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.notificationsEnabled ? 'Açık' : 'Kapalı'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary-900">Push Bildirimleri</h2>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Yeni Bildirim</span>
          </button>
        </div>

        <div className="space-y-4">
          {(notifications || []).map((notification, index) => (
            <div key={notification.id} className="card card-hover animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900">{notification.title}</h3>
                      <p className="text-sm text-secondary-600">{notification.message}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                    {notification.type === 'assignment' && 'Ödev'}
                    {notification.type === 'reminder' && 'Hatırlatma'}
                    {notification.type === 'achievement' && 'Başarı'}
                    {notification.type === 'general' && 'Genel'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-secondary-500">
                  <div className="flex items-center space-x-4">
                    <span>Gönderim: {new Date(notification.sentAt).toLocaleDateString('tr-TR')}</span>
                    <span>Okunma: {notification.readCount}/{notification.totalSent}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-secondary-400 hover:text-secondary-600">
                      <Settings className="w-4 h-4" />
                    </button>
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
