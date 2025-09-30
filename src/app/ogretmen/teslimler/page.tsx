'use client';

import { useEffect, useState } from 'react';
import { FileText, Clock, Star } from 'lucide-react';

interface SubmissionItem {
  _id: string;
  studentId: { _id: string; firstName: string; lastName: string; email: string };
  assignmentId: string;
  status: 'submitted' | 'late' | 'graded' | 'completed' | 'incomplete' | 'not_started';
  grade?: number;
  maxGrade?: number;
  submittedAt?: string;
  gradedAt?: string;
}

export default function TeacherSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch teacher's assignments, then for each get submissions, flatten and sort latest first
        const assignmentsRes = await fetch('/api/teacher/assignments');
        if (!assignmentsRes.ok) return;
        const assignments = await assignmentsRes.json();
        const all: SubmissionItem[] = [];
        for (const a of assignments) {
          const r = await fetch(`/api/teacher/assignments/${a._id}/submissions`);
          if (r.ok) {
            const s = await r.json();
            all.push(...s);
          }
        }
        all.sort((x, y) => new Date(y.submittedAt || y.gradedAt || 0).getTime() - new Date(x.submittedAt || x.gradedAt || 0).getTime());
        setSubmissions(all);
      } catch (e) {
        console.error('Submissions load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary-900">Teslim Edilen Ödevler</h1>

      {submissions.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Henüz teslim yok</h3>
          <p className="mt-1 text-sm text-secondary-500">Öğrencilerinizin teslimleri burada listelenecek.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {submissions.map((s) => (
            <div key={s._id} className="bg-white border border-secondary-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-secondary-900 font-medium">
                    {s.studentId.firstName} {s.studentId.lastName}
                  </div>
                  <div className="text-sm text-secondary-500">{s.studentId.email}</div>
                  <div className="mt-1 text-xs text-secondary-500 flex items-center gap-3">
                    {s.submittedAt && (
                      <span className="inline-flex items-center"><Clock className="h-3 w-3 mr-1" /> {new Date(s.submittedAt).toLocaleString('tr-TR')}</span>
                    )}
                    {s.status === 'graded' && (
                      <span className="inline-flex items-center text-primary-700 font-medium"><Star className="h-3 w-3 mr-1" /> {s.grade}/{s.maxGrade || 100}</span>
                    )}
                    <span className="inline-flex items-center">Durum: {s.status}</span>
                  </div>
                </div>
                <a href={`/ogretmen/odevler`} className="text-primary-600 hover:text-primary-700 text-sm font-medium">Ödeve Git</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


