'use client';

import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, Star, MessageSquare, Calendar, User } from 'lucide-react';

interface Submission {
  _id: string;
  assignmentId: {
    _id: string;
    title: string;
    description: string;
    dueDate: string;
    maxGrade?: number;
    teacherId: {
      firstName: string;
      lastName: string;
    };
    classId?: {
      name: string;
    };
  };
  status: 'pending' | 'submitted' | 'completed' | 'late' | 'graded';
  submittedAt: string;
  grade?: number;
  maxGrade?: number;
  feedback?: string;
  teacherFeedback?: string;
  gradedAt?: string;
  content: string;
  attachments?: {
    type: 'pdf' | 'video' | 'link' | 'image';
    url: string;
    name: string;
  }[];
  attempt: number;
}

export default function StudentSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'completed' | 'graded'>('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/student/submissions', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Submissions fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (submission: Submission) => {
    switch (submission.status) {
      case 'graded':
        return <Star className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'submitted':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'late':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (submission: Submission) => {
    switch (submission.status) {
      case 'graded':
        return 'Değerlendirildi';
      case 'completed':
        return 'Tamamlandı';
      case 'submitted':
        return 'Teslim Edildi';
      case 'late':
        return 'Geç Teslim';
      default:
        return 'Bekliyor';
    }
  };

  const getStatusColor = (submission: Submission) => {
    switch (submission.status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'late':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filter === 'all') return true;
    return submission.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Teslimlerim</h1>
        <div className="mt-4 sm:mt-0">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="block w-full sm:w-auto px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Tümü</option>
            <option value="submitted">Teslim Edilen</option>
            <option value="completed">Tamamlanan</option>
            <option value="graded">Değerlendirilen</option>
          </select>
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Teslim bulunamadı</h3>
          <p className="mt-1 text-sm text-secondary-500">
            {filter === 'all' 
              ? 'Henüz teslim ettiğiniz bir ödev bulunmuyor.'
              : 'Bu kategoride teslim bulunmuyor.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredSubmissions.map((submission) => (
            <div key={submission._id} className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(submission)}
                    <h3 className="text-lg font-medium text-secondary-900">
                      {submission.assignmentId.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission)}`}>
                      {getStatusText(submission)}
                    </span>
                  </div>
                  
                  <p className="mt-2 text-sm text-secondary-600">
                    {submission.assignmentId.description}
                  </p>
                  
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-secondary-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Teslim: {new Date(submission.submittedAt).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Öğretmen: {submission.assignmentId.teacherId.firstName} {submission.assignmentId.teacherId.lastName}
                    </div>
                    {submission.assignmentId.classId && (
                      <div>
                        Sınıf: {submission.assignmentId.classId.name}
                      </div>
                    )}
                    {submission.grade !== undefined && (
                      <div className="font-medium text-primary-600 flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        Not: {submission.grade}/{submission.maxGrade || submission.assignmentId.maxGrade || 100}
                      </div>
                    )}
                    <div className="text-secondary-400">
                      Deneme: {submission.attempt}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-secondary-900 mb-2">Teslim İçeriği:</h4>
                    <div className="bg-gray-50 rounded-md p-3">
                      <p className="text-sm text-secondary-700 whitespace-pre-wrap">{submission.content}</p>
                    </div>
                  </div>

                  {submission.attachments && submission.attachments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-secondary-900 mb-2">Ekler:</h4>
                      <div className="flex flex-wrap gap-2">
                        {submission.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-secondary-100 text-secondary-800 hover:bg-secondary-200"
                          >
                            {attachment.type === 'pdf' && <FileText className="h-4 w-4 mr-1" />}
                            {attachment.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {submission.teacherFeedback && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <h4 className="text-sm font-medium text-secondary-900 mb-1 flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Öğretmen Geri Bildirimi:
                      </h4>
                      <p className="text-sm text-secondary-700 whitespace-pre-wrap">{submission.teacherFeedback}</p>
                      {submission.gradedAt && (
                        <p className="text-xs text-secondary-500 mt-2">
                          Değerlendirme Tarihi: {new Date(submission.gradedAt).toLocaleString('tr-TR')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
