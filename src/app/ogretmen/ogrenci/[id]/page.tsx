'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { User, FileText, Target, BarChart3, Mail, Phone, Calendar, Download, Key, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useDataFetching } from '@/hooks/useDataFetching';
import LoadingSpinner, { CardSkeleton } from '@/components/LoadingSpinner';
import { apiClient } from '@/lib/apiClient';

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
  totalGoals: number;
  completedGoals: number;
  averageGrade: number;
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;
  
  const [isGenerating, setIsGenerating] = useState(false);
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

  const { 
    data: reports, 
    loading: reportsLoading, 
    error: reportsError,
    refetch: refetchReports 
  } = useDataFetching<{ _id: string; title: string; createdAt: string; isPublic: boolean }[]>(`/api/teacher/students/${studentId}/report`, {
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loading = studentLoading || statsLoading || reportsLoading;
  const error = studentError || statsError || reportsError;

  const refetchAll = useCallback(async () => {
    await Promise.all([refetchStudent(), refetchStats(), refetchReports()]);
  }, [refetchStudent, refetchStats, refetchReports]);

  const handleGenerateReport = async () => {
    if (!studentId) return;
    try {
      setIsGenerating(true);
      // Send minimal data; API fills defaults
      const res = await apiClient.post(`/api/teacher/students/${studentId}/report`, {});
      if (res) {
        // Refresh reports list
        await refetchReports();
        alert('Rapor oluşturuldu');
      }
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Hata');
    } finally {
      setIsGenerating(false);
    }
  };

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

  const handleDownloadPdf = async () => {
    if (!studentId) return;
    try {
      // Try new reliable API first
      let res = await fetch(`/api/teacher/students/${studentId}/report/reliable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // Son 3 ay
          endDate: new Date().toISOString()
        })
      });
      
      if (!res.ok) {
        // If reliable API fails, try fallback
        console.log('Reliable API failed, trying fallback API');
        res = await fetch(`/api/teacher/students/${studentId}/report?format=pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({})
        });
      }
      
      const contentType = res.headers.get('content-type') || '';
      
      if (res.ok) {
        if (contentType.includes('application/pdf')) {
          const blob = await res.blob();
          if (blob.size === 0) {
            throw new Error('PDF dosyası boş geldi');
          }
          
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${student?.firstName || 'ogrenci'}_${student?.lastName || 'raporu'}_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
          alert('PDF raporu başarıyla indirildi!');
        } else if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data.url) {
            alert(`Rapor oluşturuldu! Görüntülemek için: ${window.location.origin}${data.url}`);
          } else {
            throw new Error(data.error || 'Bilinmeyen yanıt formatı');
          }
        } else {
          throw new Error('Beklenmeyen yanıt formatı');
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (e) {
      console.error('PDF download error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Bilinmeyen hata';
      alert(`PDF indirme hatası:\n\n${errorMessage}\n\nLütfen tekrar deneyin.`);
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

  const goalCompletionRate = stats && stats.totalGoals > 0 
    ? Math.round((stats.completedGoals / stats.totalGoals) * 100)
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
                  style={{ width: `${assignmentCompletionRate}%` }}
                ></div>
              </div>
              <p className="text-sm text-secondary-600 mt-1">
                %{assignmentCompletionRate}
              </p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm text-secondary-600 mb-2">
                <span>Hedef Tamamlama</span>
                <span>{stats?.completedGoals || 0}/{stats?.totalGoals || 0}</span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${goalCompletionRate}%` }}
                ></div>
              </div>
              <p className="text-sm text-secondary-600 mt-1">
                %{goalCompletionRate}
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
          href={`/ogretmen/ogrenci/${studentId}/hedefler`}
          className="card hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-secondary-900">Hedefler</p>
              <p className="text-sm text-secondary-600">
                {stats?.totalGoals || 0} hedef
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

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-secondary-900">Raporlar</p>
            <button onClick={handleGenerateReport} disabled={isGenerating} className="btn-primary text-sm">
              {isGenerating ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
            </button>
          </div>
          <div className="space-y-2">
            {(!reports || reports.length === 0) && (
              <p className="text-sm text-secondary-600">Henüz rapor yok</p>
            )}
            {reports && reports.map((r) => (
              <div key={r._id} className="flex items-center justify-between">
                <Link href={`/rapor/${r._id}`} className="text-primary-600 hover:text-primary-800 text-sm">
                  {r.title}
                </Link>
                <span className="text-xs text-secondary-500">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</span>
              </div>
            ))}
          </div>
          <button onClick={handleDownloadPdf} className="btn-outline mt-4 w-full flex items-center justify-center space-x-2">
            <Download className="w-4 h-4" />
            <span>PDF İndir</span>
          </button>
        </div>
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
