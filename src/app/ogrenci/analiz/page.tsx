'use client';

import { useState, useEffect } from 'react';
import { BarChart3, FileText, Target, TrendingUp, Star, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

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
    goalsCompleted: number;
  }>;
  assignmentTitleCounts?: Array<{ title: string; count: number }>;
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
                    { name: 'Bekliyor', value: Math.max(0, (analysisData.submittedAssignments || 0) - (analysisData.gradedAssignments || 0)), color: '#F59E0B' }
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
                    { name: 'Bekliyor', value: Math.max(0, (analysisData.submittedAssignments || 0) - (analysisData.gradedAssignments || 0)), color: '#F59E0B' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}`, name as string]} />
                <Legend formatter={(value) => {
                  if (value === 'Teslim Edildi') return 'Teslim Edildi (mavi)';
                  if (value === 'Değerlendirildi') return 'Değerlendirildi (yeşil)';
                  if (value === 'Bekliyor') return 'Bekliyor (turuncu)';
                  return value;
                }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Ödev başlığına göre adet */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Başlığa Göre Ödev Dağılımı
          </h3>
          <div className="h-64">
            {analysisData.assignmentTitleCounts && analysisData.assignmentTitleCounts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={analysisData.assignmentTitleCounts.map((item, index) => ({ 
                    title: item.title.length > 15 ? item.title.slice(0, 15) + '...' : item.title, 
                    fullTitle: item.title,
                    count: item.count,
                    index: index
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="title" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [`${value}`, 'Ödev Adedi']}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0] && payload[0].payload) {
                        return `Başlık: ${payload[0].payload.fullTitle}`;
                      }
                      return `Başlık: ${label}`;
                    }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" name="Ödev Adedi" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-secondary-400 mb-4" />
                  <h3 className="text-sm font-medium text-secondary-900 mb-2">Veri Bulunamadı</h3>
                  <p className="text-sm text-secondary-500">
                    Ödev başlığı verisi mevcut değil.
                  </p>
                </div>
              </div>
            )}
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
              <Legend />
              <Line type="monotone" dataKey="assignments" stroke="#3B82F6" name="Ödevler" strokeWidth={2} />
              <Line type="monotone" dataKey="goalsCompleted" stroke="#10B981" name="Tamamlanan Hedefler" strokeWidth={2} />
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
