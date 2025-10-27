'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChildData {
  id: string;
  name: string;
  completionRate: number;
  averageGrade: number;
  assignments: number;
  completed: number;
}

export default function ParentAnalysis() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/parent/dashboard', {
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.data?.stats) {
          const childrenData = result.data.stats.map((stat: any) => ({
            id: stat.studentId,
            name: stat.studentName,
            completionRate: stat.totalAssignments > 0 
              ? Math.round((stat.completedAssignments / stat.totalAssignments) * 100)
              : 0,
            averageGrade: stat.averageGrade,
            assignments: stat.totalAssignments,
            completed: stat.completedAssignments
          }));
          setChildren(childrenData);
        }
      }
    } catch (error) {
      console.error('Analysis fetch error:', error);
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

  const pieData = children.map(child => ({
    name: child.name.split(' ')[0], // First name only
    value: child.completionRate
  }));

  const barData = children.map(child => ({
    name: child.name.split(' ')[0],
    Ortalama: child.averageGrade,
    Tamamlama: child.completionRate
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-secondary-900 mb-3">Analiz</h1>
        <p className="text-lg text-secondary-600">
          Çocuklarınızın performans analizi ve istatistikleri
        </p>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <BarChart3 className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-secondary-900 mb-2">Analiz verisi bulunmuyor</h3>
          <p className="text-secondary-600">
            Çocuklarınızın verileri henüz eklenmedi
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completion Rate Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-secondary-900 mb-4">Tamamlama Oranı</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="158%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Comparison Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-secondary-900 mb-4">Karşılaştırma</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Ortalama" fill="#0088FE" />
                <Bar dataKey="Tamamlama" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Individual Stats */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-secondary-900 mb-4">Detaylı İstatistikler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {children.map((child) => (
                <div key={child.id} className="border border-secondary-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Users className="w-5 h-5 text-primary-600 mr-2" />
                    <h4 className="text-lg font-bold text-secondary-900">{child.name}</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Ortalama Not:</span>
                      <span className="font-semibold text-secondary-900">{child.averageGrade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Tamamlama:</span>
                      <span className="font-semibold text-secondary-900">{child.completionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Ödevler:</span>
                      <span className="font-semibold text-secondary-900">{child.completed}/{child.assignments}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

