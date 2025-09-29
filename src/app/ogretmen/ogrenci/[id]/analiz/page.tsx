'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { BarChart3, FileText, Target, TrendingUp, Download } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
}

interface AnalysisData {
  assignmentCompletion: number;
  subjectStats: { [key: string]: number };
  goalsProgress: number;
  overallPerformance: number;
  monthlyProgress: Array<{
    month: string;
    assignments: number;
    goals: number;
  }>;
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

  const generateReport = async () => {
    try {
      const response = await fetch(`/api/teacher/students/${studentId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${student?.firstName}_${student?.lastName}_raporu.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Report generation error:', error);
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

  const pieData = [
    { name: 'Tamamlanan', value: analysisData.assignmentCompletion, color: '#3B82F6' },
    { name: 'Bekleyen', value: 100 - analysisData.assignmentCompletion, color: '#E5E7EB' }
  ];

  const radarData = Object.entries(analysisData.subjectStats).map(([subject, value]) => ({
    subject,
    value,
    fullMark: 100
  }));

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
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Rapor İndir</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Ödev Tamamlama</p>
              <p className="text-2xl font-semibold text-secondary-900">
                %{analysisData.assignmentCompletion}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Hedef İlerlemesi</p>
              <p className="text-2xl font-semibold text-secondary-900">
                %{analysisData.goalsProgress}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Genel Performans</p>
              <p className="text-2xl font-semibold text-secondary-900">
                %{analysisData.overallPerformance}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Branş Sayısı</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {Object.keys(analysisData.subjectStats).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Assignment Completion Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Ödev Tamamlama Oranı
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`%${value}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Performance Radar Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Branş Bazlı Performans
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Performans"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
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
            <BarChart data={analysisData.monthlyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="assignments" fill="#3B82F6" name="Ödevler" />
              <Bar dataKey="goals" fill="#10B981" name="Hedefler" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Details */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Branş Detayları
        </h3>
        <div className="space-y-4">
          {Object.entries(analysisData.subjectStats).map(([subject, value]) => (
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
    </div>
  );
}
