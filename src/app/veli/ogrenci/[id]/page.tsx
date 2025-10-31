'use client';

import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, FileText, Star, BookOpen, CheckCircle, 
  AlertCircle, Clock, Users, BarChart3, Eye, Mail
} from 'lucide-react';
import Link from 'next/link';
import { useDataFetching } from '@/hooks/useDataFetching';
import LoadingSpinner, { CardSkeleton } from '@/components/LoadingSpinner';

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  className?: string;
  stats: {
    totalAssignments: number;
    completedAssignments: number;
    averageGrade: number;
  };
  recentAssignments: Array<{
    id: string;
    title: string;
    subject: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'graded';
    grade?: number;
    maxGrade?: number;
  }>;
}

export default function StudentDetail() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  
  const { 
    data: response, 
    loading, 
    error,
    refetch 
  } = useDataFetching<{ success: boolean; data: StudentData }>(
    `/api/parent/students/${studentId}`,
    {
      enabled: !!studentId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  const data = response?.data || response as StudentData | null;

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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        
        <CardSkeleton />
        
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-secondary-900">Veri yüklenirken hata oluştu</h3>
        <p className="mt-1 text-sm text-secondary-500">{error}</p>
        <button 
          onClick={() => refetch()}
          className="mt-4 btn-primary"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-secondary-400" />
        <h3 className="mt-2 text-sm font-medium text-secondary-900">Öğrenci bulunamadı</h3>
        <p className="mt-1 text-sm text-secondary-500">
          Öğrenci bilgileri yüklenemedi veya erişim yetkiniz yok.
        </p>
        <button
          onClick={() => router.push('/veli')}
          className="mt-4 btn-primary"
        >
          Dashboard&apos;a Dön
        </button>
      </div>
    );
  }

  const completionRate = data.stats?.totalAssignments > 0
    ? Math.round((data.stats.completedAssignments / data.stats.totalAssignments) * 100)
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/veli"
          className="inline-flex items-center text-secondary-600 hover:text-secondary-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 mb-2">
              {data.firstName} {data.lastName}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm sm:text-base text-secondary-600">
              {data.className && (
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  {data.className}
                </div>
              )}
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                {data.email}
              </div>
            </div>
          </div>
          <Link
            href={`/veli/ogrenci/${studentId}/rapor`}
            className="btn-primary flex items-center justify-center space-x-2 min-h-[44px] touch-manipulation"
          >
            <Eye className="w-4 h-4" />
            <span>Rapor Görüntüle</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-blue-500">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-secondary-600">Tamamlanma</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-secondary-900 mb-1">
            {completionRate}%
          </div>
          <div className="text-sm text-secondary-600">
            {data.stats?.completedAssignments}/{data.stats?.totalAssignments} Ödev
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-green-500">
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-secondary-600">Ortalama</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-secondary-900 mb-1">
            {data.stats?.averageGrade || 0}
          </div>
          <div className="text-sm text-secondary-600">Not Ortalaması</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-yellow-500">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-secondary-600">Performans</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-secondary-900 mb-1">
            {data.stats?.averageGrade >= 80 ? '⭐️⭐️⭐️' : 
             data.stats?.averageGrade >= 60 ? '⭐️⭐️' : '⭐️'}
          </div>
          <div className="text-sm text-secondary-600">Seviye</div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="mb-8">
        <div className="card">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg sm:text-xl font-semibold text-secondary-900">Ödev Tamamlama Oranı</h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm text-secondary-600 mb-2">
                <span>Toplam Ödev</span>
                <span className="font-semibold">{data.stats?.totalAssignments || 0}</span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(completionRate, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center pt-4 border-t border-secondary-200">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {data.stats?.completedAssignments || 0}
                </div>
                <div className="text-xs text-secondary-600">Tamamlanan</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {(data.stats?.totalAssignments || 0) - (data.stats?.completedAssignments || 0)}
                </div>
                <div className="text-xs text-secondary-600">Bekleyen</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-secondary-900">
                  {completionRate}%
                </div>
                <div className="text-xs text-secondary-600">Oran</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Assignments */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-secondary-900 flex items-center">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-600" />
            Son Ödevler
          </h2>
        </div>
        
        {data.recentAssignments && data.recentAssignments.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {data.recentAssignments.slice(0, 5).map((assignment) => {
              const dueDate = new Date(assignment.dueDate);
              const isOverdue = dueDate < new Date() && assignment.status === 'pending';
              
              return (
                <div 
                  key={assignment.id} 
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border transition-all ${
                    assignment.status === 'graded' ? 'bg-green-50 border-green-200' :
                    assignment.status === 'submitted' ? 'bg-blue-50 border-blue-200' :
                    isOverdue ? 'bg-red-50 border-red-200' :
                    'bg-secondary-50 border-secondary-200'
                  }`}
                >
                  <div className="flex items-center flex-1 mb-3 sm:mb-0">
                    {assignment.status === 'graded' && (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    )}
                    {assignment.status === 'submitted' && (
                      <Clock className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                    )}
                    {(assignment.status === 'pending' || isOverdue) && (
                      <AlertCircle className={`w-5 h-5 mr-3 flex-shrink-0 ${isOverdue ? 'text-red-600' : 'text-yellow-600'}`} />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-secondary-900 truncate">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-secondary-600">{assignment.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:ml-4">
                    <div className="text-right sm:text-left">
                      {assignment.status === 'graded' && assignment.grade !== undefined ? (
                        <>
                          <div className="text-sm font-semibold text-secondary-900">
                            <span className="text-green-600">{assignment.grade}</span>
                            <span className="text-secondary-500">/{assignment.maxGrade}</span>
                          </div>
                          <div className="text-xs text-secondary-500">Değerlendirildi</div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-semibold text-secondary-500">
                            {dueDate.toLocaleDateString('tr-TR')}
                          </div>
                          <div className="text-xs text-secondary-500 capitalize">
                            {assignment.status === 'pending' ? (isOverdue ? 'Gecikmiş' : 'Bekliyor') : 'Teslim Edildi'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">Henüz ödev eklenmedi</p>
          </div>
        )}
      </div>
    </div>
  );
}
