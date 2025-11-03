'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, FileText, Download, Star, CheckCircle, Users } from 'lucide-react';
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

interface ChildOption {
  id: string;
  firstName: string;
  lastName: string;
}

export default function ParentAnalysis() {
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [student, setStudent] = useState<Student | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [childrenLoading, setChildrenLoading] = useState(true);

  const fetchChildren = useCallback(async () => {
    try {
      const response = await fetch('/api/parent/dashboard', {
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.data?.children && Array.isArray(result.data.children)) {
          const childrenData = result.data.children.map((child: any) => ({
            id: child.id || child._id,
            firstName: child.firstName,
            lastName: child.lastName,
          }));
          setChildren(childrenData);
          
          // Auto-select first child if available
          setSelectedChildId((prev) => {
            if (childrenData.length > 0 && !prev) {
              return childrenData[0].id;
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('Children fetch error:', error);
    } finally {
      setChildrenLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const fetchAnalysisData = useCallback(async () => {
    if (!selectedChildId) {
      setAnalysisData(null);
      setStudent(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch student info
      const studentResponse = await fetch(`/api/parent/students/${selectedChildId}`);
      let studentData = null;
      if (studentResponse.ok) {
        const result = await studentResponse.json();
        if (result.success && result.data) {
          studentData = {
            _id: result.data.id,
            firstName: result.data.firstName,
            lastName: result.data.lastName,
          };
          setStudent(studentData);
        }
      }

      // Fetch analysis data
      const analysisResponse = await fetch(`/api/parent/students/${selectedChildId}/analysis`);

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setAnalysisData(analysisData);
      }
    } catch (error) {
      console.error('Analysis data fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    if (selectedChildId) {
      fetchAnalysisData();
    }
  }, [selectedChildId, fetchAnalysisData]);

  if (childrenLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-secondary-400" />
        <h3 className="mt-2 text-sm font-medium text-secondary-900">Çocuk bulunamadı</h3>
        <p className="mt-1 text-sm text-secondary-500">
          Henüz kayıtlı çocuğunuz bulunmuyor.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Analiz</h1>
            <p className="mt-2 text-secondary-600">
              Çocuğunuzun detaylı performans analizi ve raporlama
            </p>
          </div>
        </div>

        {/* Child Selection */}
        <div className="card mb-6">
          <label className="block text-sm font-semibold text-secondary-900 mb-2">
            Çocuk Seçin
          </label>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="block w-full px-4 py-3 border border-secondary-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          >
            <option value="">Çocuk seçin</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.firstName} {child.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedChildId ? (
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Çocuk seçin</h3>
          <p className="mt-1 text-sm text-secondary-500">
            Analiz görmek için yukarıdan bir çocuk seçin.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !student || !analysisData ? (
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Analiz verisi bulunamadı</h3>
          <p className="mt-1 text-sm text-secondary-500">
            Bu çocuk için analiz verisi mevcut değil.
          </p>
        </div>
      ) : (
        <>
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
                            Bu çocuk için ödev başlığı verisi mevcut değil.
                          </p>
                        </div>
                      </div>
                    );
                  }
                })()}
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
        </>
      )}
    </div>
  );
}
