'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { User, FileText, Target, BarChart3, Mail, Phone, Calendar, Download } from 'lucide-react';
import Link from 'next/link';

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
  
  const [student, setStudent] = useState<Student | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reports, setReports] = useState<{ _id: string; title: string; createdAt: string; isPublic: boolean }[]>([]);

  const fetchStudentData = useCallback(async () => {
    try {
      const [studentResponse, statsResponse, reportsResponse] = await Promise.all([
        fetch(`/api/teacher/students/${studentId}`),
        fetch(`/api/teacher/students/${studentId}/stats`),
        fetch(`/api/teacher/students/${studentId}/report`)
      ]);

      if (studentResponse.ok) {
        const studentData = await studentResponse.json();
        setStudent(studentData);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (reportsResponse.ok) {
        const list = await reportsResponse.json();
        setReports(list);
      }
    } catch (error) {
      console.error('Student data fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId, fetchStudentData]);

  const handleGenerateReport = async () => {
    if (!studentId) return;
    try {
      setIsGenerating(true);
      // Send minimal data; API fills defaults
      const res = await fetch(`/api/teacher/students/${studentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Rapor oluşturma başarısız');
      }
      // Refresh list
      await fetchStudentData();
      alert('Rapor oluşturuldu');
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Hata');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!studentId) return;
    try {
      const res = await fetch(`/api/teacher/students/${studentId}/report?format=pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error('PDF oluşturma başarısız');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${student?.firstName || 'ogrenci'}_${student?.lastName || 'raporu'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Hata');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
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
            {reports.length === 0 && (
              <p className="text-sm text-secondary-600">Henüz rapor yok</p>
            )}
            {reports.map((r) => (
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
    </div>
  );
}
