'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { BarChart3, FileText, Target, Download, Star, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Label, LabelList, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
}

interface AnalysisData {
  assignmentCompletion: number;
  submittedAssignments: number;
  gradedAssignments: number;
  gradingRate: number;
  averageGrade: number;
  totalAssignments?: number;
  subjectStats: { [key: string]: number };
  subjectDetails: { [key: string]: { 
    completion: number; 
    averageGrade: number; 
    totalAssignments: number; 
    submittedAssignments: number; 
    gradedAssignments: number 
  }};
  overallPerformance: number;
  monthlyProgress: Array<{
    month: string;
    assignments: number;
    pending: number;
  }>;
  assignmentTitleCounts?: Array<{ title: string; count: number }>;
  weeklyStats: {
    totalAssignments: number;
    submittedAssignments: number;
    gradedAssignments: number;
    pendingAssignments: number;
    weekStart: string;
    weekEnd: string;
  };
}

export default function StudentAnalysisPage() {
  const params = useParams();
  const studentId = params.id as string;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalysisData = useCallback(async () => {
    try {
      const [studentResponse, analysisResponse] = await Promise.all([
        fetch(`/api/teacher/students/${studentId}`),
        fetch(`/api/teacher/students/${studentId}/analysis`)
      ]);

      if (studentResponse.ok) {
        const studentData = await studentResponse.json();
        setStudent(studentData);
      }

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setAnalysisData(analysisData);
      }
    } catch (error) {
      console.error('Analysis data fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      fetchAnalysisData();
    }
  }, [studentId, fetchAnalysisData]);

  const viewReport = () => {
    if (!student) {
      alert('Öğrenci bilgileri yüklenemedi. Lütfen sayfayı yenileyin.');
      return;
    }
    
    // Navigate to web-based report page
    window.open(`/ogretmen/ogrenci/${studentId}/rapor`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!student || !analysisData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-secondary-400" />
        <h3 className="mt-2 text-sm font-medium text-secondary-900">Analiz verisi bulunamadı</h3>
        <p className="mt-1 text-sm text-secondary-500">
          Bu öğrenci için analiz verisi mevcut değil.
        </p>
      </div>
    );
  }


  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">
              {student.firstName} {student.lastName} - Analiz
            </h1>
            <p className="mt-2 text-secondary-600">
              Detaylı performans analizi ve raporlama
            </p>
          </div>
          <button
            onClick={viewReport}
            disabled={!analysisData}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            <span>Raporu Görüntüle</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                {analysisData.submittedAssignments}/{analysisData.totalAssignments || 0} teslim edildi
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
                {analysisData.gradedAssignments}/{analysisData.submittedAssignments || 0} değerlendirildi
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
              <p className="text-sm font-medium text-secondary-600">Ortalama Not</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {analysisData.averageGrade || 0}
              </p>
              <p className="text-xs text-secondary-500">
                /100 puan
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Assignment Status Distribution - Donut Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Bu Hafta Ödev Durumu ({analysisData.weeklyStats.weekStart} - {analysisData.weeklyStats.weekEnd})
          </h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {(() => {
                  const pieData = [
                    { name: 'Teslim Edilen', value: analysisData.weeklyStats.submittedAssignments || 0, color: '#10B981' },
                    { name: 'Bekleyen', value: analysisData.weeklyStats.pendingAssignments || 0, color: '#EF4444' },
                    { name: 'Değerlendirilen', value: analysisData.weeklyStats.gradedAssignments || 0, color: '#3B82F6' }
                  ];
                  const total = pieData.reduce((s, d) => s + (d.value || 0), 0);
                  return (
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, value }) => {
                        if (!value || total === 0) return '';
                        const pct = Math.round((Number(value) / total) * 100);
                        return `${name}: ${value} (${pct}%)`;
                      }}
                      outerRadius={95}
                      innerRadius={78}
                      minAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={1} />
                      ))}
                      {/* Removed center total label per request */}
                    </Pie>
                  );
                })()}
                <Tooltip 
                  formatter={(value, name) => [`${value} ödev`, name as string]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  layout="horizontal"
                  align="center"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-secondary-600">
            <p>Toplam: {analysisData.weeklyStats.totalAssignments} ödev</p>
            <p>Bu hafta için {analysisData.weeklyStats.totalAssignments > 0 ? 'ödev verisi mevcut' : 'ödev verisi bulunmuyor'}</p>
          </div>
        </div>

        {/* Radar Chart: Başlığa Göre Ödev Dağılımı */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Başlığa Göre Ödev Dağılımı
          </h3>
          <div className="h-80">
            {(() => {
              // Get chart data - use real data if available, otherwise create fallback
              let chartData: Array<{ title: string; count: number }> = [];
              if (analysisData.assignmentTitleCounts && Array.isArray(analysisData.assignmentTitleCounts) && analysisData.assignmentTitleCounts.length > 0) {
                chartData = analysisData.assignmentTitleCounts;
              } else if (analysisData.totalAssignments && analysisData.totalAssignments > 0) {
                // Show message that no specific assignment data is available
                chartData = [
                  { title: 'Ödev Verileri Bulunamadı', count: 0 }
                ];
              }
              
              if (chartData.length > 0) {
                // Prepare data for radar chart - limit to top 8 items for better visualization
                const topItems = chartData.slice(0, 8);
                const maxCount = Math.max(...topItems.map(item => item.count));
                
                const radarData = topItems.map((item, index) => ({
                  subject: item.title && item.title.length > 12 ? item.title.slice(0, 12) + '...' : (item.title || 'Başlıksız'),
                  fullTitle: item.title || 'Başlıksız',
                  A: item.count || 0,
                  fullMark: maxCount
                }));

                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fontSize: 11 }}
                        className="text-xs"
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, maxCount]} 
                        tick={{ fontSize: 10 }}
                      />
                      <Radar
                        name="Ödev Adedi"
                        dataKey="A"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
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
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px'
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                );
              } else {
                return (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="mx-auto h-12 w-12 text-secondary-400 mb-4" />
                      <h3 className="text-sm font-medium text-secondary-900 mb-2">Veri Bulunamadı</h3>
                      <p className="text-sm text-secondary-500">
                        Bu öğrenci için ödev başlığı verisi mevcut değil.
                      </p>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      </div>

      {/* Tüm Zamanlarda Ödev Durumu - Detaylı Grafik */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Tüm Zamanlarda Ödev Durumu
        </h3>
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Teslim Edilen</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {analysisData.submittedAssignments || 0}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {(analysisData.totalAssignments ?? 0) > 0 
                      ? `%${Math.round((analysisData.submittedAssignments / (analysisData.totalAssignments ?? 1)) * 100)} oranında`
                      : '%0 oranında'}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Bekleyen</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">
                    {Math.max(0, (analysisData.totalAssignments || 0) - (analysisData.submittedAssignments || 0))}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {(analysisData.totalAssignments ?? 0) > 0 
                      ? `%${Math.round(((analysisData.totalAssignments ?? 0) - analysisData.submittedAssignments) / (analysisData.totalAssignments ?? 1) * 100)} oranında`
                      : '%0 oranında'}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Değerlendirilen</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {analysisData.gradedAssignments || 0}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {analysisData.submittedAssignments > 0 
                      ? `%${Math.round((analysisData.gradedAssignments / analysisData.submittedAssignments) * 100)} teslim edilen içinde`
                      : '%0 teslim edilen içinde'}
                  </p>
                </div>
                <Star className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                {
                  name: 'Ödev Durumu',
                  'Teslim Edilen': analysisData.submittedAssignments || 0,
                  'Bekleyen': Math.max(0, (analysisData.totalAssignments || 0) - (analysisData.submittedAssignments || 0)),
                  'Değerlendirilen': analysisData.gradedAssignments || 0,
                  'Toplam': analysisData.totalAssignments || 0
                }
              ]}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                label={{ value: 'Ödev Sayısı', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12 } }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  const total = analysisData.totalAssignments || 0;
                  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                  return [`${value} ödev (${percentage}%)`, name];
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '13px',
                  padding: '12px'
                }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Legend 
                verticalAlign="top" 
                height={40}
                wrapperStyle={{ fontSize: '13px', paddingBottom: '10px' }}
                iconType="rect"
              />
              <Bar 
                dataKey="Teslim Edilen" 
                stackId="a" 
                fill="#10B981" 
                radius={[4, 4, 0, 0]}
                stroke="#ffffff"
                strokeWidth={1}
              >
                <LabelList 
                  dataKey="Teslim Edilen" 
                  position="top" 
                  formatter={(value: number) => value > 0 ? value : ''}
                  style={{ fontSize: '12px', fontWeight: 'bold' }}
                />
              </Bar>
              <Bar 
                dataKey="Bekleyen" 
                stackId="a" 
                fill="#EF4444" 
                radius={[0, 0, 4, 4]}
                stroke="#ffffff"
                strokeWidth={1}
              >
                <LabelList 
                  dataKey="Bekleyen" 
                  position="top" 
                  formatter={(value: number) => value > 0 ? value : ''}
                  style={{ fontSize: '12px', fontWeight: 'bold' }}
                />
              </Bar>
              <Bar 
                dataKey="Değerlendirilen" 
                fill="#3B82F6" 
                radius={[4, 4, 4, 4]}
                stroke="#ffffff"
                strokeWidth={2}
                opacity={0.8}
              >
                <LabelList 
                  dataKey="Değerlendirilen" 
                  position="top" 
                  formatter={(value: number) => value > 0 ? value : ''}
                  style={{ fontSize: '12px', fontWeight: 'bold' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Teslim Oranı</p>
                <p className="text-3xl font-bold text-green-900 mt-2">
                  %{analysisData.assignmentCompletion || 0}
                </p>
                <p className="text-xs text-green-600 mt-2">
                  {analysisData.submittedAssignments || 0} / {analysisData.totalAssignments || 0} ödev teslim edildi
                </p>
              </div>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Değerlendirme Oranı</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">
                  %{analysisData.gradingRate || 0}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  {analysisData.gradedAssignments || 0} / {analysisData.submittedAssignments || 0} teslim değerlendirildi
                </p>
              </div>
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <Star className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-secondary-50 border border-secondary-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-secondary-600 mt-0.5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-secondary-900 mb-2">Grafik Açıklaması</h4>
              <ul className="text-xs text-secondary-600 space-y-1">
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <strong>Teslim Edilen:</strong> Öğrencinin teslim ettiği ödevlerin sayısı
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  <strong>Bekleyen:</strong> Henüz teslim edilmemiş ödevlerin sayısı
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  <strong>Değerlendirilen:</strong> Teslim edilen ödevlerden değerlendirilenlerin sayısı
                </li>
              </ul>
            </div>
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
              <Line type="monotone" dataKey="assignments" stroke="#3B82F6" name="Yapılan Ödevler" strokeWidth={2} />
              <Line type="monotone" dataKey="pending" stroke="#EF4444" name="Yapılmayan Ödevler" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Details */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Branş Detayları
        </h3>
        <div className="space-y-6">
          {Object.entries(analysisData.subjectDetails || {})
            .filter(([subject]) => subject.toLowerCase() !== 'deneme')
            .map(([subject, details]) => (
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
                    <span className="text-sm font-medium text-secondary-600">Teslim Oranı</span>
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
                    <span className="text-sm font-medium text-secondary-600">Ortalama Not</span>
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
