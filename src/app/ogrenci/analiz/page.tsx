'use client';

import { useState, useEffect } from 'react';
import { BarChart3, FileText, Target, TrendingUp, Star, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface AnalysisData {
  assignmentCompletion: number;
  submittedAssignments: number;
  gradedAssignments: number;
  gradingRate: number;
  averageGrade: number;
  subjectStats: { [key: string]: { 
    completion: number; 
    averageGrade: number; 
    totalAssignments: number; 
    submittedAssignments: number; 
    gradedAssignments: number 
  }};
  goalsProgress: number;
  overallPerformance: number;
  monthlyProgress: Array<{
    month: string;
    assignments: number;
    goals: number;
  }>;
}

export default function StudentAnalysisPage() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  const fetchAnalysisData = async () => {
    try {
      const response = await fetch('/api/student/analysis', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        setAnalysisData(data);
      }
    } catch (error) {
      console.error('Analysis data fetch error:', error);
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

  if (!analysisData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-secondary-400" />
        <h3 className="mt-2 text-sm font-medium text-secondary-900">Analiz verisi bulunamadı</h3>
        <p className="mt-1 text-sm text-secondary-500">
          Analiz verileriniz yüklenirken bir hata oluştu.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">
          Performans Analizim
        </h1>
        <p className="mt-2 text-secondary-600">
          Ödev performansınızı ve ilerlemenizi detaylı olarak inceleyin
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Ödev Teslim Oranı</p>
              <p className="text-2xl font-semibold text-secondary-900">
                %{analysisData.assignmentCompletion}
              </p>
              <p className="text-xs text-secondary-500">
                {analysisData.submittedAssignments} teslim edildi
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Değerlendirme Oranı</p>
              <p className="text-2xl font-semibold text-secondary-900">
                %{analysisData.gradingRate}
              </p>
              <p className="text-xs text-secondary-500">
                {analysisData.gradedAssignments} değerlendirildi
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Ortalama Notum</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {analysisData.averageGrade || 0}
              </p>
              <p className="text-xs text-secondary-500">
                /100 puan
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Hedef İlerlemesi</p>
              <p className="text-2xl font-semibold text-secondary-900">
                %{analysisData.goalsProgress}
              </p>
              <p className="text-xs text-secondary-500">
                Hedefler tamamlandı
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Assignment Status Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Ödev Durum Dağılımım
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Teslim Edildi', value: analysisData.submittedAssignments, color: '#3B82F6' },
                    { name: 'Değerlendirildi', value: analysisData.gradedAssignments, color: '#10B981' },
                    { name: 'Bekliyor', value: (analysisData.submittedAssignments || 0) - (analysisData.gradedAssignments || 0), color: '#F59E0B' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: 'Teslim Edildi', value: analysisData.submittedAssignments, color: '#3B82F6' },
                    { name: 'Değerlendirildi', value: analysisData.gradedAssignments, color: '#10B981' },
                    { name: 'Bekliyor', value: (analysisData.submittedAssignments || 0) - (analysisData.gradedAssignments || 0), color: '#F59E0B' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Performance with Grades */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Branş Bazlı Not Dağılımım
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(analysisData.subjectStats || {}).map(([subject, details]) => ({
                subject: subject.length > 8 ? subject.substring(0, 8) + '...' : subject,
                not: details.averageGrade,
                teslim: details.completion
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="not" fill="#3B82F6" name="Ortalama Not" />
                <Bar dataKey="teslim" fill="#10B981" name="Teslim Oranı" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Progress Chart */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Aylık İlerleme
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analysisData.monthlyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="assignments" stroke="#3B82F6" name="Ödevler" strokeWidth={2} />
              <Line type="monotone" dataKey="goals" stroke="#10B981" name="Hedefler" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Details */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Branş Detaylarım
        </h3>
        <div className="space-y-6">
          {Object.entries(analysisData.subjectStats || {}).map(([subject, details]) => (
            <div key={subject} className="border border-secondary-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-secondary-900">{subject}</h4>
                <div className="flex items-center space-x-4 text-sm text-secondary-600">
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {details.totalAssignments} ödev
                  </span>
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {details.submittedAssignments} teslim
                  </span>
                  <span className="flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    {details.gradedAssignments} değerlendirildi
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-secondary-600">Teslim Oranım</span>
                    <span className="text-sm text-secondary-900">%{details.completion}</span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${details.completion}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-secondary-600">Ortalama Notum</span>
                    <span className="text-sm text-secondary-900">{details.averageGrade || 0}/100</span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${details.averageGrade || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
