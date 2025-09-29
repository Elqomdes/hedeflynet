'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Download, Share2, Calendar, User, Target, BarChart3 } from 'lucide-react';

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
    firstName: string;
    lastName: string;
  };
  teacher: {
    firstName: string;
    lastName: string;
  };
}

export default function ReportViewPage() {
  const params = useParams();
  const reportId = params.id as string;
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (error) {
      console.error('Report fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId, fetchReport]);

  const handleDownload = () => {
    // Create a simple text file download
    const content = `
${report?.title}

${report?.content}

Tarih: ${report?.createdAt ? new Date(report.createdAt).toLocaleDateString('tr-TR') : ''}
Öğrenci: ${report?.student.firstName} ${report?.student.lastName}
Öğretmen: ${report?.teacher.firstName} ${report?.teacher.lastName}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report?.student.firstName}_${report?.student.lastName}_raporu.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-secondary-400" />
        <h3 className="mt-2 text-sm font-medium text-secondary-900">Rapor bulunamadı</h3>
        <p className="mt-1 text-sm text-secondary-500">
          Aradığınız rapor bulunamadı veya erişim yetkiniz yok.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">{report.title}</h1>
              <p className="mt-2 text-secondary-600">
                {report.student.firstName} {report.student.lastName} - Performans Raporu
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleDownload}
                className="btn-outline flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>İndir</span>
              </button>
              <button
                onClick={handleShare}
                className="btn-secondary flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Paylaş</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-secondary-600">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span>Öğrenci: {report.student.firstName} {report.student.lastName}</span>
            </div>
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span>Öğretmen: {report.teacher.firstName} {report.teacher.lastName}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Tarih: {new Date(report.createdAt).toLocaleDateString('tr-TR')}</span>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="p-3 rounded-lg bg-blue-500 mx-auto w-12 h-12 flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-medium text-secondary-600">Ödev Tamamlama</p>
            <p className="text-2xl font-semibold text-secondary-900">
              %{report.data.assignmentCompletion}
            </p>
          </div>

          <div className="card text-center">
            <div className="p-3 rounded-lg bg-green-500 mx-auto w-12 h-12 flex items-center justify-center mb-3">
              <Target className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-medium text-secondary-600">Hedef İlerlemesi</p>
            <p className="text-2xl font-semibold text-secondary-900">
              %{report.data.goalsProgress}
            </p>
          </div>

          <div className="card text-center">
            <div className="p-3 rounded-lg bg-purple-500 mx-auto w-12 h-12 flex items-center justify-center mb-3">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-medium text-secondary-600">Genel Performans</p>
            <p className="text-2xl font-semibold text-secondary-900">
              %{report.data.overallPerformance}
            </p>
          </div>

          <div className="card text-center">
            <div className="p-3 rounded-lg bg-yellow-500 mx-auto w-12 h-12 flex items-center justify-center mb-3">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-medium text-secondary-600">Branş Sayısı</p>
            <p className="text-2xl font-semibold text-secondary-900">
              {Object.keys(report.data.subjectStats).length}
            </p>
          </div>
        </div>

        {/* Subject Performance */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Branş Bazlı Performans
          </h3>
          <div className="space-y-4">
            {Object.entries(report.data.subjectStats).map(([subject, value]) => (
              <div key={subject} className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary-900">{subject}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-secondary-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-secondary-600 w-12 text-right">
                    %{value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report Content */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Detaylı Değerlendirme
          </h3>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-secondary-700 font-sans">
              {report.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
