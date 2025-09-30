'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Clock, Star, Search, Filter, CheckCircle } from 'lucide-react';

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
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'submitted' | 'late' | 'graded'>('all');
  const [grading, setGrading] = useState<SubmissionItem | null>(null);
  const [grade, setGrade] = useState<number>(0);
  const [teacherFeedback, setTeacherFeedback] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch teacher's assignments, then for each get submissions, flatten and sort latest first
        const assignmentsRes = await fetch('/api/teacher/assignments', {
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!assignmentsRes.ok) return;
        const assignments = await assignmentsRes.json();
        const all: SubmissionItem[] = [];
        for (const a of assignments) {
          const r = await fetch(`/api/teacher/assignments/${a._id}/submissions`, {
            credentials: 'include',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          });
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return submissions
      .filter(s => status === 'all' ? true : s.status === status)
      .filter(s => !q || `${s.studentId.firstName} ${s.studentId.lastName} ${s.studentId.email}`.toLowerCase().includes(q));
  }, [submissions, query, status]);

  const handleGrade = async () => {
    if (!grading) return;
    try {
      const res = await fetch(`/api/teacher/assignments/submissions/${grading._id}/grade`, {
        method: 'PUT',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify({ grade, teacherFeedback, status: 'graded' })
      });
      if (res.ok) {
        // Refresh list
        setGrading(null);
        setGrade(0);
        setTeacherFeedback('');
        // simple reload of page state
        setLoading(true);
        // re-run loader
        (async () => {
          try {
            const assignmentsRes = await fetch('/api/teacher/assignments', {
              credentials: 'include',
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache' },
            });
            if (!assignmentsRes.ok) return;
            const assignments = await assignmentsRes.json();
            const all: SubmissionItem[] = [];
            for (const a of assignments) {
              const r = await fetch(`/api/teacher/assignments/${a._id}/submissions`, {
                credentials: 'include',
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
              });
              if (r.ok) {
                const s = await r.json();
                all.push(...s);
              }
            }
            all.sort((x, y) => new Date(y.submittedAt || y.gradedAt || 0).getTime() - new Date(x.submittedAt || x.gradedAt || 0).getTime());
            setSubmissions(all);
          } finally {
            setLoading(false);
          }
        })();
        alert('Değerlendirme kaydedildi');
      } else {
        const err = await res.json();
        alert(err.error || 'Değerlendirme başarısız');
      }
    } catch (e) {
      console.error('Grade error', e);
      alert('Değerlendirme başarısız');
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary-900">Teslim Edilen Ödevler</h1>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-secondary-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Öğrenci ara..."
              className="pl-9 pr-3 py-2 w-full border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-secondary-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="all">Tümü</option>
              <option value="submitted">Teslim Edildi</option>
              <option value="late">Geç Teslim</option>
              <option value="graded">Değerlendirildi</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Henüz teslim yok</h3>
          <p className="mt-1 text-sm text-secondary-500">Öğrencilerinizin teslimleri burada listelenecek.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((s) => (
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
                <div className="flex items-center gap-2">
                  {s.status !== 'graded' && (
                    <button
                      onClick={() => {
                        setGrading(s);
                        setGrade(s.grade || 0);
                        setTeacherFeedback('');
                      }}
                      className="inline-flex items-center px-3 py-1 rounded-md bg-primary-600 text-white text-sm hover:bg-primary-700"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Değerlendir
                    </button>
                  )}
                  <a href={`/ogretmen/odevler`} className="text-primary-600 hover:text-primary-700 text-sm font-medium">Ödeve Git</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {grading && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">
                Değerlendir - {grading.studentId.firstName} {grading.studentId.lastName}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Puan</label>
                  <input type="number" min={0} max={grading.maxGrade || 100} value={grade} onChange={(e) => setGrade(parseInt(e.target.value) || 0)} className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Geri Bildirim</label>
                  <textarea rows={4} value={teacherFeedback} onChange={(e) => setTeacherFeedback(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setGrading(null)} className="px-4 py-2 rounded-md border border-secondary-300 text-sm">İptal</button>
                <button onClick={handleGrade} className="px-4 py-2 rounded-md text-sm text-white bg-primary-600 hover:bg-primary-700">Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


