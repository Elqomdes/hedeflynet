'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Search, BarChart3, Mail } from 'lucide-react';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function AnalysisSelectPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/teacher/students');
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
        }
      } catch (error) {
        console.error('Students fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filtered = students.filter((s) => {
    const text = `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Detaylı Analiz</h1>
        <p className="mt-1 text-secondary-600">Bir öğrenci seçerek analiz sayfasına gidin.</p>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Öğrenci ara (ad, soyad, e-posta)"
            className="w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Öğrenci bulunamadı</h3>
          <p className="mt-1 text-sm text-secondary-500">Arama kriterlerini değiştirin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((student) => (
            <div key={student._id} className="bg-white border border-secondary-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                  <Users className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-secondary-900">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="text-xs text-secondary-500 flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {student.email}
                  </div>
                </div>
              </div>
              <Link
                href={`/ogretmen/ogrenci/${student._id}/analiz`}
                className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Detaylı Analiz
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


