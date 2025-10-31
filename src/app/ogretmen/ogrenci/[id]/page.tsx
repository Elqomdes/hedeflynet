'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { User, FileText, BarChart3, Mail, Phone, Calendar, Key, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useDataFetching } from '@/hooks/useDataFetching';
import LoadingSpinner, { CardSkeleton } from '@/components/LoadingSpinner';

interface Student {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
}

interface StudentStats {
  totalAssignments: number;
  completedAssignments: number;
  averageGrade: number;
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Use optimized data fetching hooks
  const { 
    data: student, 
    loading: studentLoading, 
    error: studentError,
    refetch: refetchStudent 
  } = useDataFetching<Student>(`/api/teacher/students/${studentId}`, {
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { 
    data: stats, 
    loading: statsLoading, 
    error: statsError,
    refetch: refetchStats 
  } = useDataFetching<StudentStats>(`/api/teacher/students/${studentId}/stats`, {
    enabled: !!studentId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const loading = studentLoading || statsLoading;
  const error = studentError || statsError;

  const refetchAll = useCallback(async () => {
    await Promise.all([refetchStudent(), refetchStats()]);
  }, [refetchStudent, refetchStats]);


  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    if (newPassword.length < 6) {
      alert('Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Şifreler eşleşmiyor');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const response = await fetch(`/api/teacher/students/${studentId}/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Öğrenci şifresi başarıyla güncellendi');
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(data.error || 'Şifre güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Password update error:', error);
      alert('Şifre güncellenirken hata oluştu');
    } finally {
      setIsUpdatingPassword(false);
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-secondary-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-secondary-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-10 bg-secondary-200 rounded w-32 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-secondary-900">Veri yüklenirken hata oluştu</h3>
        <p className="mt-1 text-sm text-secondary-500">
          {error}
        </p>
        <button 
          onClick={refetchAll}
          className="mt-4 btn-primary"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-secondary-400" />
        <h3 className="mt-2 text-sm font-medium text-secondary-900">Öğrenci bulunamadı</h3>
        <p className="mt-1 text-sm text-secondary-500">
          Aradığınız öğrenci bulunamadı veya erişim yetkiniz yok.
        </p>
      </div>
    );
  }

  const assignmentCompletionRate = stats && stats.totalAssignments > 0 
    ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100)
    : 0;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">
              {student.firstName} {student.lastName}
            </h1>
            <p className="mt-2 text-secondary-600">
              Öğrenci detayları ve performans analizi
            </p>
          </div>
          <Link
            href={`/ogretmen/ogrenci/${studentId}/analiz`}
            className="btn-primary flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Detaylı Analiz</span>
          </Link>
        </div>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Öğrenci Bilgileri
          </h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <User className="h-5 w-5 text-secondary-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-secondary-900">Ad Soyad</p>
                <p className="text-sm text-secondary-600">
                  {student.firstName} {student.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-secondary-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-secondary-900">E-posta</p>
                <p className="text-sm text-secondary-600">{student.email}</p>
              </div>
            </div>
            {student.phone && (
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-secondary-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">Telefon</p>
                  <p className="text-sm text-secondary-600">{student.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-secondary-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-secondary-900">Kayıt Tarihi</p>
                <p className="text-sm text-secondary-600">
                  {new Date(student.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
              <div className="flex items-center">
                <Key className="h-5 w-5 text-secondary-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">Şifre Yönetimi</p>
                  <p className="text-sm text-secondary-600">Öğrenci şifresini güncelle</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="btn-outline text-sm flex items-center space-x-2"
              >
                <Key className="w-4 h-4" />
                <span>Şifre Güncelle</span>
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Genel Performans
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-secondary-600 mb-2">
                <span>Ödev Tamamlama</span>
                <span>{stats?.completedAssignments || 0}/{stats?.totalAssignments || 0}</span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(assignmentCompletionRate, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-secondary-600 mt-1">
                %{assignmentCompletionRate}
              </p>
            </div>

            {stats && stats.averageGrade > 0 && (
              <div>
                <p className="text-sm font-medium text-secondary-900">Ortalama Not</p>
                <p className="text-2xl font-bold text-primary-600">
                  {stats.averageGrade.toFixed(1)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href={`/ogretmen/ogrenci/${studentId}/odevler`}
          className="card hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-secondary-900">Ödevler</p>
              <p className="text-sm text-secondary-600">
                {stats?.totalAssignments || 0} ödev
              </p>
            </div>
          </div>
        </Link>

        <Link
          href={`/ogretmen/ogrenci/${studentId}/analiz`}
          className="card hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-secondary-900">Detaylı Analiz</p>
              <p className="text-sm text-secondary-600">
                Performans raporu
              </p>
            </div>
          </div>
        </Link>

      </div>

      {/* Password Update Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Öğrenci Şifresini Güncelle
            </h3>
            <p className="text-sm text-secondary-600 mb-4">
              {student.firstName} {student.lastName} için yeni şifre belirleyin
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Yeni Şifre
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                    placeholder="En az 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-secondary-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-secondary-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Şifreyi Onayla
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                    placeholder="Şifreyi tekrar girin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-secondary-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-secondary-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 rounded-md hover:bg-secondary-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleUpdatePassword}
                disabled={isUpdatingPassword}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdatingPassword ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
