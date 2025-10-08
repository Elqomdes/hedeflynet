'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  FileText, 
  Download, 
  Share2, 
  Calendar, 
  User, 
  Target, 
  BarChart3, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  BookOpen,
  Award,
  Loader2,
  Printer,
  Eye,
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
    goalsProgress: number;
    overallPerformance: number;
  };
  statistics: {
    totalAssignments: number;
    submittedAssignments: number;
    gradedAssignments: number;
    pendingAssignments: number;
    totalGoals: number;
    completedGoals: number;
  };
  subjects: Array<{
    subjectName: string;
    totalAssignments: number;
    submittedAssignments: number;
    gradedAssignments: number;
    completionRate: number;
    averageGrade: number;
  }>;
  monthlyProgress: Array<{
    month: string;
    assignments: number;
    goalsCompleted: number;
    averageGrade: number;
  }>;
  recentAssignments: Array<{
    title: string;
    dueDate: string;
    status: string;
    grade?: number;
  }>;
  goals: Array<{
    title: string;
    description: string;
    status: string;
    dueDate: string;
    completedAt?: string;
  }>;
  insights: {
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
  };
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
              <Target className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Hedef İlerlemesi</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              %{Math.round(reportData.performance.goalsProgress)}
            </p>
            <p className="text-xs text-gray-500">
              {reportData.statistics.completedGoals} / {reportData.statistics.totalGoals} hedef
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

        {/* Subject Performance */}
        {reportData.subjects && reportData.subjects.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden print:shadow-none">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <BookOpen className="w-6 h-6 mr-3" />
                Branş Bazlı Performans
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {reportData.subjects.map((subject, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow print:shadow-none">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">{subject.subjectName}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Tamamlama: %{Math.round(subject.completionRate)}</span>
                        <span>Ortalama: {Math.round(subject.averageGrade)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${subject.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                        %{Math.round(subject.completionRate)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {subject.submittedAssignments} / {subject.totalAssignments} ödev teslim edildi
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Goals Section */}
        {reportData.goals && reportData.goals.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden print:shadow-none">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Target className="w-6 h-6 mr-3" />
                Hedefler ve İlerleme
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {reportData.goals.slice(0, 5).map((goal, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(goal.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(goal.status)}`}>
                          {getStatusText(goal.status)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                    {goal.dueDate && (
                      <p className="text-xs text-gray-500">Bitiş Tarihi: {goal.dueDate}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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

        {/* Insights */}
        {reportData.insights && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden print:shadow-none">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Star className="w-6 h-6 mr-3" />
                Değerlendirme ve Öneriler
              </h3>
            </div>
            <div className="p-6">
              {reportData.insights.recommendations && reportData.insights.recommendations.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Star className="w-5 h-5 text-blue-500 mr-2" />
                    Öneriler
                  </h4>
                  <div className="space-y-2">
                    {reportData.insights.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-gray-700">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {reportData.insights.strengths && reportData.insights.strengths.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Güçlü Yönler
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {reportData.insights.strengths.map((strength, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {reportData.insights.areasForImprovement && reportData.insights.areasForImprovement.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <TrendingUp className="w-5 h-5 text-orange-500 mr-2" />
                    Geliştirilmesi Gereken Alanlar
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {reportData.insights.areasForImprovement.map((area, index) => (
                      <span key={index} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
