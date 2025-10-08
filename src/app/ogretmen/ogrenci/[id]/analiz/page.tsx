'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { BarChart3, FileText, Target, Download, Star, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

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
  subjectStats: { [key: string]: number };
  subjectDetails: { [key: string]: { 
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
  const params = useParams();
  const studentId = params.id as string;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

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

  const generateReport = async () => {
    if (!student) {
      alert('Öğrenci bilgileri yüklenemedi. Lütfen sayfayı yenileyin.');
      return;
    }
    
    setGeneratingReport(true);
    try {
      console.log('Generating new report for student:', studentId);
      
      // Use new reliable API
      const response = await fetch(`/api/teacher/students/${studentId}/report/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // Son 3 ay
          endDate: new Date().toISOString(),
          includeCharts: true,
          includeDetailedAssignments: true,
          includeGoals: true,
          includeInsights: true,
          format: 'pdf'
        }),
      });

      console.log('New report response status:', response.status);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/pdf')) {
          // PDF response
          const blob = await response.blob();
          if (blob.size === 0) {
            throw new Error('PDF dosyası boş geldi');
          }
          
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${student.firstName}_${student.lastName}_raporu_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          alert('Rapor başarıyla indirildi!');
        } else {
          throw new Error('Beklenmeyen yanıt formatı');
        }
      } else {
        // Error response
        let errorMessage = 'Rapor oluşturma başarısız';
        let details: string | undefined = undefined;
        
        try {
          const errorData = await response.json();
          console.error('Report generation error response:', errorData);
          errorMessage = errorData?.error || errorMessage;
          details = errorData?.details;
        } catch (parseErr) {
          console.error('Failed to parse error response:', parseErr);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        // Show specific error messages
        if (errorMessage.includes('bulunamadı')) {
          alert('Öğrenci veya öğretmen bulunamadı. Lütfen giriş yaptığınızdan emin olun.');
        } else if (errorMessage.includes('bağlantı')) {
          alert('Veritabanı bağlantı hatası. Lütfen daha sonra tekrar deneyin.');
        } else if (errorMessage.includes('Geçersiz')) {
          alert('Geçersiz öğrenci ID. Lütfen sayfayı yenileyin.');
        } else if (errorMessage.includes('PDF oluşturulamadı')) {
          alert('PDF oluşturulamadı. Lütfen daha sonra tekrar deneyin.');
        } else {
          const finalMessage = details ? `${errorMessage}\n\nDetay: ${details}` : errorMessage;
          alert(`Rapor oluşturulurken hata oluştu:\n\n${finalMessage}`);
        }
      }
    } catch (error) {
      console.error('Report generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      alert(`Rapor oluşturulurken hata oluştu:\n\n${errorMessage}\n\nLütfen tekrar deneyin.`);
    } finally {
      setGeneratingReport(false);
    }
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
            onClick={generateReport}
            disabled={generatingReport || !analysisData}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingReport ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Oluşturuluyor...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Rapor İndir</span>
              </>
            )}
          </button>
        </div>
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
                {analysisData.submittedAssignments}/{analysisData.submittedAssignments + (analysisData.submittedAssignments || 0)} teslim edildi
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
            Ödev Durum Dağılımı
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
            {(() => {
              // Get chart data - use real data if available, otherwise create fallback
              let chartData = [];
              if (analysisData.assignmentTitleCounts && Array.isArray(analysisData.assignmentTitleCounts) && analysisData.assignmentTitleCounts.length > 0) {
                chartData = analysisData.assignmentTitleCounts;
              } else if ((analysisData as any).totalAssignments > 0) {
                // Create fallback data based on total assignments
                chartData = [
                  { title: 'Genel Ödevler', count: (analysisData as any).totalAssignments }
                ];
              }
              
              return chartData.length > 0;
            })() ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={(() => {
                    let chartData = [];
                    if (analysisData.assignmentTitleCounts && Array.isArray(analysisData.assignmentTitleCounts) && analysisData.assignmentTitleCounts.length > 0) {
                      chartData = analysisData.assignmentTitleCounts;
                    } else if ((analysisData as any).totalAssignments > 0) {
                      chartData = [
                        { title: 'Genel Ödevler', count: (analysisData as any).totalAssignments }
                      ];
                    }
                    
                    return chartData.map((item, index) => ({ 
                      title: item.title && item.title.length > 15 ? item.title.slice(0, 15) + '...' : (item.title || 'Başlıksız'), 
                      fullTitle: item.title || 'Başlıksız',
                      count: item.count || 0,
                      index: index
                    }));
                  })()}
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
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Ödev Adedi', angle: -90, position: 'insideLeft' }}
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
                  <Bar 
                    dataKey="count" 
                    fill="#3B82F6" 
                    name="Ödev Adedi" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-secondary-400 mb-4" />
                  <h3 className="text-sm font-medium text-secondary-900 mb-2">Veri Bulunamadı</h3>
                  <p className="text-sm text-secondary-500">
                    Bu öğrenci için ödev başlığı verisi mevcut değil.
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
          Branş Detayları
        </h3>
        <div className="space-y-6">
          {Object.entries(analysisData.subjectDetails || {}).map(([subject, details]) => (
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
