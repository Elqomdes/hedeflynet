'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Eye, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Report {
  id: string;
  title: string;
  date: string;
  studentName: string;
  studentId: string;
  type: string;
}

export default function ParentReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/parent/dashboard', {
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (response.ok) {
        const result = await response.json();
        // Simulated reports from dashboard data
        if (result.data?.children) {
          const fakeReports = result.data.children.map((child: any, index: number) => ({
            id: `report-${index}`,
            title: `${child.firstName} ${child.lastName} - Performans Raporu`,
            date: new Date().toLocaleDateString('tr-TR'),
            studentName: `${child.firstName} ${child.lastName}`,
            studentId: child.id,
            type: 'Performans'
          }));
          setReports(fakeReports);
        }
      }
    } catch (error) {
      console.error('Reports fetch error:', error);
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

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-secondary-900 mb-3">Raporlar</h1>
        <p className="text-lg text-secondary-600">
          Çocuklarınızın performans raporlarını görüntüleyin ve indirin
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <FileText className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-secondary-900 mb-2">Henüz rapor bulunmuyor</h3>
          <p className="text-secondary-600">
            Öğretmeninizden rapor talebinde bulunabilirsiniz
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-600 rounded-full">
                  {report.type}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-secondary-900 mb-2">
                {report.title}
              </h3>
              
              <div className="flex items-center text-sm text-secondary-600 mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                {report.date}
              </div>
              
              <div className="flex items-center text-sm text-secondary-600 mb-4">
                <span>{report.studentName}</span>
              </div>
              
              <div className="flex gap-2">
                <Link
                  href={`/veli/ogrenci/${report.studentId}/rapor`}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-semibold"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Görüntüle
                </Link>
                <button className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg transition-colors text-sm font-semibold">
                  <Download className="w-4 h-4 mr-2" />
                  İndir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

