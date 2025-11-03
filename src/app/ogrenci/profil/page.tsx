'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, FileText, BarChart3, Edit3, Save, X } from 'lucide-react';

interface StudentProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  school?: string;
  grade?: string;
  parentId?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  teacherId?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  lastLogin?: string;
}

interface StudentStats {
  totalAssignments: number;
  completedAssignments: number;
  averageGrade: number;
}

export default function StudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/student/profile', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || ''
        });
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/student/stats', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setEditing(false);
        alert('Profil başarıyla güncellendi');
      } else {
        const error = await response.json();
        alert(error.error || 'Profil güncellenemedi');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Profil güncellenemedi');
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || ''
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-secondary-400" />
        <h3 className="mt-2 text-sm font-medium text-secondary-900">Profil bulunamadı</h3>
        <p className="mt-1 text-sm text-secondary-500">
          Profil bilgileriniz yüklenirken bir hata oluştu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Profilim</h1>
        <div className="mt-4 sm:mt-0">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Düzenle
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSaveProfile}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </button>
              <button
                onClick={handleCancelEdit}
                className="inline-flex items-center px-4 py-2 border border-secondary-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <X className="h-4 w-4 mr-2" />
                İptal
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <h2 className="text-lg font-medium text-secondary-900 mb-6">Kişisel Bilgiler</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Ad
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                    className="block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-sm text-secondary-900">{profile.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Soyad
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                    className="block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-sm text-secondary-900">{profile.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  E-posta
                </label>
                <p className="text-sm text-secondary-900 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-secondary-400" />
                  {profile.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Telefon
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-sm text-secondary-900 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-secondary-400" />
                    {profile.phone || 'Belirtilmemiş'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Doğum Tarihi
                </label>
                <p className="text-sm text-secondary-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-secondary-400" />
                  {'Belirtilmemiş'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Okul
                </label>
                <p className="text-sm text-secondary-900">{'Belirtilmemiş'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Sınıf
                </label>
                <p className="text-sm text-secondary-900">{'Belirtilmemiş'}</p>
              </div>
            </div>
          </div>

          {/* Parent Information */}
          {profile.parentId && (
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <h2 className="text-lg font-medium text-secondary-900 mb-6">Veli Bilgileri</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Veli Adı
                  </label>
                  <p className="text-sm text-secondary-900">
                    {profile.parentId.firstName} {profile.parentId.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Veli E-posta
                  </label>
                  <p className="text-sm text-secondary-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-secondary-400" />
                    {profile.parentId.email}
                  </p>
                </div>
                {profile.parentId.phone && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Veli Telefonu
                    </label>
                    <p className="text-sm text-secondary-900 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-secondary-400" />
                      {profile.parentId.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Teacher Information */}
          {profile.teacherId && (
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <h2 className="text-lg font-medium text-secondary-900 mb-6">Öğretmen Bilgileri</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Öğretmen Adı
                  </label>
                  <p className="text-sm text-secondary-900">
                    {profile.teacherId.firstName} {profile.teacherId.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Öğretmen E-posta
                  </label>
                  <p className="text-sm text-secondary-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-secondary-400" />
                    {profile.teacherId.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <h2 className="text-lg font-medium text-secondary-900 mb-6">İstatistikler</h2>
            
            {stats && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-sm font-medium text-blue-900">Ödevler</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">
                    {stats.completedAssignments}/{stats.totalAssignments}
                  </span>
                </div>

                {/* Hedefler ve Planlar kaldırıldı */}

                {stats.averageGrade > 0 && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 text-yellow-600 mr-3" />
                      <span className="text-sm font-medium text-yellow-900">Ortalama Not</span>
                    </div>
                    <span className="text-sm font-bold text-yellow-600">
                      {stats.averageGrade.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-secondary-200">
              <div className="text-sm text-secondary-600">
                <p className="mb-2">
                  <strong>Üyelik Tarihi:</strong><br />
                  {new Date(profile.createdAt).toLocaleDateString('tr-TR')}
                </p>
                {profile.lastLogin && (
                  <p>
                    <strong>Son Giriş:</strong><br />
                    {new Date(profile.lastLogin).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
