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
  Loader2
} from 'lucide-react';

interface Report {
  _id: string;
  title: string;
  content: string;
  data: {
    assignmentCompletion: number;
    subjectStats: { [key: string]: number };
    goalsProgress: number;
    overallPerformance: number;
  };
  createdAt: string;
  student: {
    _id?: string;
    firstName: string;
    lastName: string;
  };
  teacher: {
    firstName: string;
    lastName: string;
  };
  reportData?: {
    performance: {
      assignmentCompletion: number;
      goalsProgress: number;
      overallPerformance: number;
      averageGrade: number;
      totalAssignments: number;
      submittedAssignments: number;
      gradedAssignments: number;
      gradingRate: number;
    };
    subjectStats: Record<string, {
      completion: number;
      averageGrade: number;
      totalAssignments: number;
      submittedAssignments: number;
      gradedAssignments: number;
    }>;
    monthlyProgress: Array<{
      month: string;
      assignments: number;
      goalsCompleted: number;
      averageGrade: number;
    }>;
    goals: Array<{
      title: string;
      description: string;
      progress: number;
      dueDate: string;
      status: 'completed' | 'in_progress' | 'pending';
    }>;
    assignments: Array<{
      title: string;
      subject: string;
      dueDate: string;
      submittedDate?: string;
      grade?: number;
      status: 'submitted' | 'graded' | 'pending' | 'late';
    }>;
    recommendations: string[];
    strengths: string[];
    areasForImprovement: string[];
  };
}

export default function ReportViewPage() {
  const params = useParams();
  const reportId = params.id as string;
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/reports/${reportId}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Rapor yüklenemedi');
      }
    } catch (error) {
      console.error('Report fetch error:', error);
      setError('Rapor yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId, fetchReport]);

  const handleDownload = async () => {
    if (!report) return;
    
    setDownloading(true);
    try {
      const response = await fetch(`/api/teacher/students/${report.student._id || 'unknown'}/report?format=pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.student.firstName}_${report.student.lastName}_raporu.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('PDF indirme başarısız');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('PDF indirme başarısız. Lütfen tekrar deneyin.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: report?.title,
          text: report?.content,
          url: window.location.href
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      // Fallback: copy to clipboard
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
            onClick={fetchReport}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Rapor Bulunamadı</h3>
          <p className="text-gray-600">
            Aradığınız rapor bulunamadı veya erişim yetkiniz yok.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-4 sm:mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 sm:px-8 py-4 sm:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="text-white">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{report.title}</h1>
                <p className="text-blue-100 text-sm sm:text-base lg:text-lg">
                  {report.student.firstName} {report.student.lastName} - Performans Raporu
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-0 lg:mt-0">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="bg-white text-blue-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 min-h-[44px] touch-manipulation w-full sm:w-auto"
                >
                  {downloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{downloading ? 'İndiriliyor...' : 'PDF İndir'}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors flex items-center justify-center space-x-2 min-h-[44px] touch-manipulation w-full sm:w-auto"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Paylaş</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="px-4 sm:px-8 py-4 sm:py-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Öğrenci</p>
                  <p className="font-semibold text-gray-900">{report.student.firstName} {report.student.lastName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Öğretmen</p>
                  <p className="font-semibold text-gray-900">{report.teacher.firstName} {report.teacher.lastName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Tarih</p>
                  <p className="font-semibold text-gray-900">{new Date(report.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Ödev Tamamlama</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              %{report.reportData?.performance?.assignmentCompletion || report.data.assignmentCompletion}
            </p>
            <p className="text-xs text-gray-500">
              {report.reportData?.performance?.submittedAssignments || 0} / {report.reportData?.performance?.totalAssignments || 0} ödev
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Hedef İlerlemesi</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              %{report.reportData?.performance?.goalsProgress || report.data.goalsProgress}
            </p>
            <p className="text-xs text-gray-500">Hedeflerde ilerleme</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Genel Performans</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              %{report.reportData?.performance?.overallPerformance || report.data.overallPerformance}
            </p>
            <p className="text-xs text-gray-500">Toplam performans</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Award className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Ortalama Not</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {report.reportData?.performance?.averageGrade || 0}
            </p>
            <p className="text-xs text-gray-500">100 üzerinden</p>
          </div>
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <BookOpen className="w-6 h-6 mr-3" />
              Branş Bazlı Performans
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {Object.entries(report.reportData?.subjectStats || report.data.subjectStats).map(([subject, stats]: [string, any]) => (
                <div key={subject} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">{subject}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Tamamlama: %{stats.completion || stats}</span>
                      {stats.averageGrade && <span>Ortalama: {stats.averageGrade}</span>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${stats.completion || stats}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                      %{stats.completion || stats}
                    </span>
                  </div>
                  {stats.totalAssignments && (
                    <div className="mt-2 text-xs text-gray-500">
                      {stats.submittedAssignments || 0} / {stats.totalAssignments} ödev teslim edildi
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Goals and Assignments */}
        {report.reportData && (
          <>
            {/* Goals Section */}
            {report.reportData.goals && report.reportData.goals.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <Target className="w-6 h-6 mr-3" />
                    Hedefler ve İlerleme
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {report.reportData.goals.slice(0, 5).map((goal, index) => (
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
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${goal.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">%{goal.progress}</span>
                        </div>
                        {goal.dueDate && (
                          <p className="text-xs text-gray-500 mt-2">Bitiş Tarihi: {goal.dueDate}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Assignments */}
            {report.reportData.assignments && report.reportData.assignments.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <FileText className="w-6 h-6 mr-3" />
                    Son Ödevler
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {report.reportData.assignments.slice(0, 5).map((assignment, index) => (
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
                          <span>{assignment.subject}</span>
                          <span>Son Tarih: {assignment.dueDate}</span>
                        </div>
                        {assignment.grade && (
                          <div className="mt-2 text-sm">
                            <span className="font-semibold text-gray-900">Not: </span>
                            <span className="text-blue-600 font-semibold">{assignment.grade}/100</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {report.reportData.recommendations && report.reportData.recommendations.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <Star className="w-6 h-6 mr-3" />
                    Öneriler ve Değerlendirme
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {report.reportData.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-gray-700">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                  
                  {report.reportData.strengths && report.reportData.strengths.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        Güçlü Yönler
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {report.reportData.strengths.map((strength, index) => (
                          <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.reportData.areasForImprovement && report.reportData.areasForImprovement.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <TrendingUp className="w-5 h-5 text-orange-500 mr-2" />
                        Geliştirilmesi Gereken Alanlar
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {report.reportData.areasForImprovement.map((area, index) => (
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
          </>
        )}

        {/* Report Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <FileText className="w-6 h-6 mr-3" />
              Detaylı Değerlendirme
            </h3>
          </div>
          <div className="p-6">
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                {report.content}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
