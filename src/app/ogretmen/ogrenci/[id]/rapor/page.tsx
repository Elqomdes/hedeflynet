'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  FileText, 
  Download, 
  Share2, 
  Calendar, 
  User, 
  BarChart3, 
  Clock,
  CheckCircle,
  AlertCircle,
  Award,
  Loader2,
  Printer,
  RefreshCw
} from 'lucide-react';

interface StudentReportData {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    class?: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  performance: {
    assignmentCompletion: number;
    averageGrade: number;
    gradingRate: number;
    overallPerformance: number;
  };
  statistics: {
    totalAssignments: number;
    submittedAssignments: number;
    gradedAssignments: number;
    pendingAssignments: number;
  };
  recentAssignments: Array<{
    title: string;
    dueDate: string;
    status: string;
    grade?: number;
  }>;
  generatedAt: string;
}

export default function StudentReportPage() {
  const params = useParams();
  const studentId = params.id as string;
  
  const [reportData, setReportData] = useState<StudentReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReportData = useCallback(async () => {
    try {
      setError(null);
      setRefreshing(true);
      
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();
      
      const response = await fetch(`/api/teacher/students/${studentId}/report/data?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Rapor verileri yüklenemedi');
      }
    } catch (error) {
      console.error('Report data fetch error:', error);
      setError('Rapor verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      fetchReportData();
    }
  }, [studentId, fetchReportData]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${reportData?.student.firstName} ${reportData?.student.lastName} - Performans Raporu`,
          text: 'Öğrenci performans raporunu görüntüleyin',
          url: window.location.href
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Rapor linki panoya kopyalandı');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'graded':
        return <Award className="w-4 h-4 text-blue-500" />;
      case 'submitted':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'late':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'graded':
        return 'Değerlendirildi';
      case 'submitted':
        return 'Teslim Edildi';
      case 'late':
        return 'Gecikti';
      case 'pending':
        return 'Beklemede';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'late':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Rapor yükleniyor...</h3>
          <p className="text-gray-600">Lütfen bekleyin</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Hata Oluştu</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchReportData}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Rapor Bulunamadı</h3>
          <p className="text-gray-600">
            Rapor verileri bulunamadı veya erişim yetkiniz yok.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 print:bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden print:shadow-none print:border-0">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 print:bg-blue-600">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2 print:text-2xl">
                  {reportData.student.firstName} {reportData.student.lastName} - Performans Raporu
                </h1>
                <p className="text-blue-100 text-lg print:text-base">
                  Dönem: {new Date(reportData.period.startDate).toLocaleDateString('tr-TR')} - {new Date(reportData.period.endDate).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-4 lg:mt-0 print:hidden">
                <button
                  onClick={handlePrint}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Yazdır</span>
                </button>
                <button
                  onClick={handleShare}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors flex items-center space-x-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Paylaş</span>
                </button>
                <button
                  onClick={fetchReportData}
                  disabled={refreshing}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-400 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {refreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>{refreshing ? 'Yenileniyor...' : 'Yenile'}</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Öğrenci</p>
                  <p className="font-semibold text-gray-900">{reportData.student.firstName} {reportData.student.lastName}</p>
                  {reportData.student.class && (
                    <p className="text-xs text-gray-500">Sınıf: {reportData.student.class}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Öğretmen</p>
                  <p className="font-semibold text-gray-900">{reportData.teacher.firstName} {reportData.teacher.lastName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Rapor Tarihi</p>
                  <p className="font-semibold text-gray-900">{new Date(reportData.generatedAt).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition-shadow print:shadow-none">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Ödev Tamamlama</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              %{Math.round(reportData.performance.assignmentCompletion)}
            </p>
            <p className="text-xs text-gray-500">
              {reportData.statistics.submittedAssignments} / {reportData.statistics.totalAssignments} ödev
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition-shadow print:shadow-none">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Değerlendirme Oranı</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              %{Math.round(reportData.performance.gradingRate)}
            </p>
            <p className="text-xs text-gray-500">
              {reportData.statistics.gradedAssignments} / {reportData.statistics.submittedAssignments} değerlendirildi
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition-shadow print:shadow-none">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Genel Performans</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              %{Math.round(reportData.performance.overallPerformance)}
            </p>
            <p className="text-xs text-gray-500">Toplam performans</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition-shadow print:shadow-none">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Award className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Ortalama Not</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {Math.round(reportData.performance.averageGrade)}
            </p>
            <p className="text-xs text-gray-500">100 üzerinden</p>
          </div>
        </div>


        {/* Recent Assignments */}
        {reportData.recentAssignments && reportData.recentAssignments.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden print:shadow-none">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <FileText className="w-6 h-6 mr-3" />
                Son Ödevler
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {reportData.recentAssignments.slice(0, 5).map((assignment, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(assignment.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(assignment.status)}`}>
                          {getStatusText(assignment.status)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Son Tarih: {assignment.dueDate}</span>
                      {assignment.grade && (
                        <span className="font-semibold text-blue-600">Not: {assignment.grade}/100</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Assignment Statistics */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden print:shadow-none">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <BarChart3 className="w-6 h-6 mr-3" />
              Ödev İstatistikleri
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {reportData.statistics.totalAssignments}
                </div>
                <div className="text-sm text-gray-600">Toplam Ödev</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {reportData.statistics.submittedAssignments}
                </div>
                <div className="text-sm text-gray-600">Teslim Edilen</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {reportData.statistics.gradedAssignments}
                </div>
                <div className="text-sm text-gray-600">Değerlendirilen</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
