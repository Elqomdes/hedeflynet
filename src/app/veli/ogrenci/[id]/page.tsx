'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, FileText, TrendingUp, Star, Clock, Target, Award, 
  BarChart3, Calendar, BookOpen, CheckCircle, AlertCircle, 
  Eye, Download, PieChart, Activity, Users
} from 'lucide-react';
import Link from 'next/link';

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
    goalsAchieved: number;
    goalsTotal: number;
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
  performanceChart: Array<{
    month: string;
    average: number;
  }>;
}

export default function StudentDetail() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      const response = await fetch(`/api/parent/students/${studentId}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data || result);
      } else {
        console.error('Student data fetch failed');
      }
    } catch (error) {
      console.error('Student data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-bold text-secondary-900 mb-2">Veri Bulunamadı</h2>
          <p className="text-secondary-600 mb-4">Öğrenci bilgileri yüklenemedi</p>
          <button
            onClick={() => router.push('/veli')}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const completionRate = data.stats?.totalAssignments > 0
    ? Math.round((data.stats.completedAssignments / data.stats.totalAssignments) * 100)
    : 0;

  const goalsRate = data.stats?.goalsTotal > 0
    ? Math.round((data.stats.goalsAchieved / data.stats.goalsTotal) * 100)
    : 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/veli"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-semibold">Dashboard'a Dön</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 mb-2">
              {data.firstName} {data.lastName}
            </h1>
            {data.className && (
              <p className="text-lg text-secondary-600 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                {data.className}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href={`/veli/ogrenci/${studentId}/rapor`}
              className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-semibold"
            >
              <Eye className="w-5 h-5 mr-2" />
              Rapor Görüntüle
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8" />
            <span className="text-sm opacity-90">Tamamlanma</span>
          </div>
          <div className="text-3xl font-bold mb-1">{completionRate}%</div>
          <div className="text-sm opacity-90">{data.stats?.completedAssignments}/{data.stats?.totalAssignments} Ödev</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8" />
            <span className="text-sm opacity-90">Ortalama</span>
          </div>
          <div className="text-3xl font-bold mb-1">{data.stats?.averageGrade || 0}</div>
          <div className="text-sm opacity-90">Not Ortalaması</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8" />
            <span className="text-sm opacity-90">Hedefler</span>
          </div>
          <div className="text-3xl font-bold mb-1">{goalsRate}%</div>
          <div className="text-sm opacity-90">{data.stats?.goalsAchieved}/{data.stats?.goalsTotal} Tamamlandı</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8" />
            <span className="text-sm opacity-90">Başarı</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {data.stats?.averageGrade >= 80 ? '⭐️⭐️⭐️' : 
             data.stats?.averageGrade >= 60 ? '⭐️⭐️' : '⭐️'}
          </div>
          <div className="text-sm opacity-90">Performans Seviyesi</div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Assignment Progress */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-bold text-secondary-900">Ödev Tamamlama Oranı</h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm text-secondary-600 mb-2">
                <span>Toplam Ödev</span>
                <span className="font-semibold">{data.stats?.totalAssignments || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-1000"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center pt-4 border-t">
              <div>
                <div className="text-2xl font-bold text-green-600">{data.stats?.completedAssignments || 0}</div>
                <div className="text-xs text-secondary-600">Tamamlanan</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {(data.stats?.totalAssignments || 0) - (data.stats?.completedAssignments || 0)}
                </div>
                <div className="text-xs text-secondary-600">Bekleyen</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary-900">{completionRate}%</div>
                <div className="text-xs text-secondary-600">Oran</div>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Progress */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-bold text-secondary-900">Hedef İlerlemesi</h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm text-secondary-600 mb-2">
                <span>Toplam Hedef</span>
                <span className="font-semibold">{data.stats?.goalsTotal || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000"
                  style={{ width: `${goalsRate}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center pt-4 border-t">
              <div>
                <div className="text-2xl font-bold text-purple-600">{data.stats?.goalsAchieved || 0}</div>
                <div className="text-xs text-secondary-600">Başarılı</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {(data.stats?.goalsTotal || 0) - (data.stats?.goalsAchieved || 0)}
                </div>
                <div className="text-xs text-secondary-600">Devam Eden</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary-900">{goalsRate}%</div>
                <div className="text-xs text-secondary-600">Tamamlama</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Assignments */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary-900 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-primary-600" />
            Son Ödevler
          </h2>
        </div>
        
        {data.recentAssignments && data.recentAssignments.length > 0 ? (
          <div className="space-y-4">
            {data.recentAssignments.slice(0, 5).map((assignment, index) => {
              const dueDate = new Date(assignment.dueDate);
              const isOverdue = dueDate < new Date() && assignment.status === 'pending';
              
              return (
                <div 
                  key={assignment.id} 
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                    assignment.status === 'graded' ? 'bg-green-50 border-green-200' :
                    assignment.status === 'submitted' ? 'bg-blue-50 border-blue-200' :
                    isOverdue ? 'bg-red-50 border-red-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center flex-1">
                    {assignment.status === 'graded' && <CheckCircle className="w-5 h-5 text-green-600 mr-3" />}
                    {assignment.status === 'submitted' && <Clock className="w-5 h-5 text-blue-600 mr-3" />}
                    {(assignment.status === 'pending' || isOverdue) && (
                      <AlertCircle className={`w-5 h-5 mr-3 ${isOverdue ? 'text-red-600' : 'text-yellow-600'}`} />
                    )}
                    <div>
                      <h3 className="font-semibold text-secondary-900">{assignment.title}</h3>
                      <p className="text-sm text-secondary-600">{assignment.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-secondary-900">
                        {assignment.status === 'graded' && assignment.grade !== undefined ? (
                          <>
                            <span className="text-green-600">{assignment.grade}</span>
                            <span className="text-secondary-500">/{assignment.maxGrade}</span>
                          </>
                        ) : (
                          <span className="text-secondary-500">
                            {dueDate.toLocaleDateString('tr-TR')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-secondary-500 capitalize">{assignment.status}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">Henüz ödev eklenmedi</p>
          </div>
        )}
      </div>
    </div>
  );
}
