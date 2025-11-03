'use client';

import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, Download, ExternalLink, Star, MessageSquare, Target, BookOpen, Users, Zap, Calendar, User } from 'lucide-react';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  type: 'individual' | 'class';
  dueDate: string;
  maxGrade?: number;
  publishAt?: string;
  closeAt?: string;
  attachments: {
    type: 'pdf' | 'video' | 'link';
    url: string;
    name: string;
  }[];
  teacherId: {
    firstName: string;
    lastName: string;
  };
  classId?: {
    name: string;
  };
  submission?: {
    status: 'pending' | 'submitted' | 'completed' | 'late' | 'graded';
    submittedAt?: string;
    grade?: number;
    maxGrade?: number;
    feedback?: string;
    teacherFeedback?: string;
    gradedAt?: string;
    content?: string;
    attachments?: {
      type: 'pdf' | 'video' | 'link' | 'image';
      url: string;
      name: string;
    }[];
    attempt?: number;
  } | null;
  category?: 'academic' | 'behavioral' | 'skill' | 'personal' | 'other';
  priority?: 'low' | 'medium' | 'high';
  successCriteria?: string;
  progress?: number; // 0-100
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);
  const [submittingAssignment, setSubmittingAssignment] = useState<string | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/student/assignments', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Assignments fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (assignment: Assignment) => {
    if (!assignment.submission) {
      const isOverdue = new Date(assignment.dueDate) < new Date();
      return isOverdue ? (
        <AlertCircle className="h-5 w-5 text-red-500" />
      ) : (
        <Clock className="h-5 w-5 text-yellow-500" />
      );
    }

    switch (assignment.submission.status) {
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

  const getStatusText = (assignment: Assignment) => {
    const now = new Date();
    if (assignment.publishAt && now < new Date(assignment.publishAt)) return 'Henüz Yayınlanmadı';
    if (assignment.closeAt && now > new Date(assignment.closeAt) && !assignment.submission) return 'Kapanış Geçti';
    if (!assignment.submission) {
      const isOverdue = new Date(assignment.dueDate) < new Date();
      return isOverdue ? 'Süresi Geçmiş' : 'Bekliyor';
    }

    switch (assignment.submission.status) {
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

  const getStatusColor = (assignment: Assignment) => {
    const now = new Date();
    if (assignment.publishAt && now < new Date(assignment.publishAt)) return 'bg-gray-100 text-gray-800';
    if (assignment.closeAt && now > new Date(assignment.closeAt) && !assignment.submission) return 'bg-red-100 text-red-800';
    if (!assignment.submission) {
      const isOverdue = new Date(assignment.dueDate) < new Date();
      return isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
    }

    switch (assignment.submission.status) {
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

  // Goal-like helper functions
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'academic':
        return <BookOpen className="h-4 w-4" />;
      case 'behavioral':
        return <Users className="h-4 w-4" />;
      case 'skill':
        return <Zap className="h-4 w-4" />;
      case 'personal':
        return <Star className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getCategoryText = (category?: string) => {
    switch (category) {
      case 'academic':
        return 'Akademik';
      case 'behavioral':
        return 'Davranışsal';
      case 'skill':
        return 'Beceri';
      case 'personal':
        return 'Kişisel';
      default:
        return 'Genel';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return 'Belirtilmemiş';
    }
  };

  const updateProgress = async (assignmentId: string, progress: number) => {
    try {
      setUpdatingProgress(assignmentId);
      const response = await fetch(`/api/student/assignments/${assignmentId}/progress`, {
        method: 'PATCH',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ progress })
      });

      if (response.ok) {
        fetchAssignments(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || 'İlerleme güncellenemedi');
      }
    } catch (error) {
      console.error('Progress update error:', error);
      alert('İlerleme güncellenemedi');
    } finally {
      setUpdatingProgress(null);
    }
  };

  const handleSubmitAssignment = async (assignmentId: string) => {
    if (!submissionContent.trim()) {
      alert('Ödev içeriği gereklidir');
      return;
    }

    try {
      const response = await fetch(`/api/student/assignments/${assignmentId}/submit`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          content: submissionContent,
          attachments: []
        })
      });

      if (response.ok) {
        setSubmittingAssignment(null);
        setSubmissionContent('');
        fetchAssignments(); // Refresh the list
        alert('Ödev başarıyla teslim edildi');
      } else {
        const error = await response.json();
        alert(error.error || 'Ödev teslim edilemedi');
      }
    } catch (error) {
      console.error('Assignment submission error:', error);
      alert('Ödev teslim edilemedi');
    }
  };

  const handleResubmitAssignment = async (assignmentId: string) => {
    if (!submissionContent.trim()) {
      alert('Ödev içeriği gereklidir');
      return;
    }

    try {
      const response = await fetch(`/api/student/assignments/${assignmentId}/resubmit`, {
        method: 'PUT',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          content: submissionContent,
          attachments: []
        })
      });

      if (response.ok) {
        setSubmittingAssignment(null);
        setSubmissionContent('');
        fetchAssignments(); // Refresh the list
        alert('Ödev başarıyla yeniden gönderildi');
      } else {
        const error = await response.json();
        alert(error.error || 'Ödev yeniden gönderilemedi');
      }
    } catch (error) {
      console.error('Assignment resubmission error:', error);
      alert('Ödev yeniden gönderilemedi');
    }
  };

  // Partition assignments for display
  const now = new Date();
  const isOverdueFn = (a: Assignment) => {
    const noSubmission = !a.submission;
    const duePassed = new Date(a.dueDate) < now;
    const markedLate = a.submission?.status === 'late';
    return (noSubmission && duePassed) || markedLate;
  };
  const isCompletedFn = (a: Assignment) => {
    const status = a.submission?.status;
    return status === 'completed' || status === 'graded';
  };
  const isActiveFn = (a: Assignment) => {
    return !isOverdueFn(a) && !isCompletedFn(a);
  };

  const activeAssignments = assignments.filter(isActiveFn);
  const overdueAssignments = assignments.filter(isOverdueFn);
  const completedAssignments = assignments.filter(isCompletedFn);

  const filteredAssignments = activeAssignments.filter(assignment => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !assignment.submission;
    if (filter === 'submitted') return assignment.submission?.status === 'submitted';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-secondary-900">Ödevlerim</h1>
        <div className="mt-0 sm:mt-0">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="block w-full sm:w-auto px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 min-h-[44px] text-base"
          >
            <option value="all">Tümü</option>
            <option value="pending">Bekleyen</option>
            <option value="submitted">Teslim Edilen</option>
          </select>
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Ödev bulunamadı</h3>
          <p className="mt-1 text-sm text-secondary-500">
            {filter === 'all' 
              ? 'Görüntülenecek aktif ödev bulunmuyor.'
              : 'Bu kategoride aktif ödev bulunmuyor.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredAssignments.map((assignment) => (
            <div key={assignment._id} className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(assignment)}
                    <h3 className="text-lg font-medium text-secondary-900">
                      {assignment.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment)}`}>
                      {getStatusText(assignment)}
                    </span>
                  </div>
                  
                  <p className="mt-2 text-sm text-secondary-600">
                    {assignment.description}
                  </p>

                  {/* Category and Priority */}
                  {(assignment.category || assignment.priority) && (
                    <div className="flex items-center gap-2 mb-3">
                      {assignment.category && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200`}>
                          {getCategoryIcon(assignment.category)}
                          <span className="ml-1">{getCategoryText(assignment.category)}</span>
                        </span>
                      )}
                      {assignment.priority && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(assignment.priority)}`}>
                          {getPriorityText(assignment.priority)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Success Criteria */}
                  {assignment.successCriteria && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-secondary-700 mb-1">Başarı Kriterleri:</h4>
                      <p className="text-sm text-secondary-600">{assignment.successCriteria}</p>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {assignment.progress !== undefined && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-secondary-600 mb-2">
                        <span>İlerleme</span>
                        <span className="font-medium">{assignment.progress}%</span>
                      </div>
                      <div className="w-full bg-secondary-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${assignment.progress}%` }}
                        ></div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => updateProgress(assignment._id, 100)}
                          disabled={updatingProgress === assignment._id}
                          className="px-3 py-1 rounded-md text-xs bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                          title="Tamamlandı olarak işaretle"
                        >
                          {updatingProgress === assignment._id ? 'Güncelleniyor...' : 'Tamamlandı'}
                        </button>
                        <button
                          onClick={() => updateProgress(assignment._id, 75)}
                          disabled={updatingProgress === assignment._id}
                          className="px-3 py-1 rounded-md text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                          title="İyi ilerleme olarak işaretle"
                        >
                          İyi İlerleme
                        </button>
                        <button
                          onClick={() => updateProgress(assignment._id, 50)}
                          disabled={updatingProgress === assignment._id}
                          className="px-3 py-1 rounded-md text-xs bg-yellow-600 text-white hover:bg-yellow-700 transition-colors disabled:opacity-50"
                          title="Orta ilerleme olarak işaretle"
                        >
                          Orta İlerleme
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-secondary-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Teslim: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                    </div>
                    {assignment.publishAt && (
                      <div>
                        Yayın: {new Date(assignment.publishAt).toLocaleString('tr-TR')}
                      </div>
                    )}
                    {assignment.closeAt && (
                      <div>
                        Kapanış: {new Date(assignment.closeAt).toLocaleString('tr-TR')}
                      </div>
                    )}
                    <div>
                      Öğretmen: {assignment.teacherId.firstName} {assignment.teacherId.lastName}
                    </div>
                    {assignment.classId && (
                      <div>
                        Sınıf: {assignment.classId.name}
                      </div>
                    )}
                    {assignment.submission?.grade !== undefined && (
                      <div className="font-medium text-primary-600 flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        Not: {assignment.submission.grade}/{assignment.submission.maxGrade || assignment.maxGrade || 100}
                      </div>
                    )}
                  </div>

                  {assignment.attachments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-secondary-900 mb-2">Ekler:</h4>
                      <div className="flex flex-wrap gap-2">
                        {assignment.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-secondary-100 text-secondary-800 hover:bg-secondary-200"
                          >
                            {attachment.type === 'pdf' && <FileText className="h-4 w-4 mr-1" />}
                            {attachment.type === 'video' && <ExternalLink className="h-4 w-4 mr-1" />}
                            {attachment.type === 'link' && <ExternalLink className="h-4 w-4 mr-1" />}
                            {attachment.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {assignment.submission?.teacherFeedback && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <h4 className="text-sm font-medium text-secondary-900 mb-1 flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Öğretmen Geri Bildirimi:
                      </h4>
                      <p className="text-sm text-secondary-700 whitespace-pre-wrap">{assignment.submission.teacherFeedback}</p>
                      {assignment.submission.gradedAt && (
                        <p className="text-xs text-secondary-500 mt-2">
                          Değerlendirme Tarihi: {new Date(assignment.submission.gradedAt).toLocaleString('tr-TR')}
                        </p>
                      )}
                    </div>
                  )}

                  {!assignment.submission && (
                    <div className="mt-4">
                      <button
                        onClick={() => setSubmittingAssignment(assignment._id)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Teslim Et
                      </button>
                    </div>
                  )}
                  {/* Disable when closed and no late allowed */}
                  {(() => {
                    const now = new Date();
                    const isClosed = assignment.closeAt && now > new Date(assignment.closeAt);
                    if (isClosed && !assignment.submission) {
                      return (
                        <div className="mt-2 text-xs text-red-600">Bu ödev kapanmıştır.</div>
                      );
                    }
                    return null;
                  })()}

                  {/* Allow resubmission if not graded */}
                  {assignment.submission && assignment.submission.status !== 'graded' && (
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => setSubmittingAssignment(assignment._id)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Yeniden Gönder
                      </button>
                      {assignment.submission.submittedAt && (
                        <span className="text-xs text-secondary-500">
                          Son Gönderim: {new Date(assignment.submission.submittedAt).toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed and Overdue Folders */}
      <div className="space-y-4">
        {/* Completed Folder */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <button
            className="w-full px-4 py-3 text-left hover:bg-secondary-50 transition-colors rounded-lg"
            onClick={(e) => {
              const section = (e.currentTarget.nextElementSibling as HTMLDivElement);
              if (section) {
                section.classList.toggle('hidden');
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-secondary-900">Tamamlanan Ödevler</h4>
                  <p className="text-sm text-secondary-600">{completedAssignments.length} ödev</p>
                </div>
              </div>
            </div>
          </button>
          <div className="px-4 pb-4 border-t border-secondary-100 hidden">
            {completedAssignments.length === 0 ? (
              <div className="py-4 text-center text-sm text-secondary-500">Henüz tamamlanan ödev yok.</div>
            ) : (
              <div className="space-y-2 mt-3">
                {completedAssignments.map((assignment) => (
                  <div key={assignment._id} className="p-3 bg-white border border-secondary-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <FileText className="h-4 w-4 text-secondary-500 flex-shrink-0" />
                          <h5 className="font-medium text-secondary-900 truncate">{assignment.title}</h5>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-secondary-600">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(assignment.dueDate).toLocaleDateString('tr-TR')}</span>
                          </span>
                          {assignment.submission?.grade !== undefined && (
                            <span className="flex items-center space-x-1 text-yellow-600 font-semibold">
                              <Star className="h-3 w-3" />
                              <span>
                                {assignment.submission.grade}/{assignment.submission.maxGrade || assignment.maxGrade || 100}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-green-700 bg-green-50">
                        Tamamlandı
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Overdue Folder */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <button
            className="w-full px-4 py-3 text-left hover:bg-secondary-50 transition-colors rounded-lg"
            onClick={(e) => {
              const section = (e.currentTarget.nextElementSibling as HTMLDivElement);
              if (section) {
                section.classList.toggle('hidden');
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-red-500 p-2 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-secondary-900">Süresi Geçmiş Ödevler</h4>
                  <p className="text-sm text-secondary-600">{overdueAssignments.length} ödev</p>
                </div>
              </div>
            </div>
          </button>
          <div className="px-4 pb-4 border-t border-secondary-100 hidden">
            {overdueAssignments.length === 0 ? (
              <div className="py-4 text-center text-sm text-secondary-500">Süresi geçmiş ödev yok.</div>
            ) : (
              <div className="space-y-2 mt-3">
                {overdueAssignments.map((assignment) => (
                  <div key={assignment._id} className="p-3 bg-white border border-secondary-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <FileText className="h-4 w-4 text-secondary-500 flex-shrink-0" />
                          <h5 className="font-medium text-secondary-900 truncate">{assignment.title}</h5>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-secondary-600">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(assignment.dueDate).toLocaleDateString('tr-TR')}</span>
                          </span>
                          <span className="text-red-600 font-medium">Süresi geçmiş</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-red-700 bg-red-50">
                        Geçti
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Submission Modal */}
      {submittingAssignment && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">
                Ödev Teslim Et
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">
                    Ödev İçeriği
                  </label>
                  <textarea
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    rows={6}
                    className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ödev içeriğinizi buraya yazın..."
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittingAssignment(null);
                    setSubmissionContent('');
                  }}
                  className="px-4 py-2 border border-secondary-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 min-h-[44px] touch-manipulation order-3"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleSubmitAssignment(submittingAssignment)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 min-h-[44px] touch-manipulation order-1"
                >
                  Teslim Et
                </button>
                <button
                  onClick={() => handleResubmitAssignment(submittingAssignment!)}
                  className="px-4 py-2 border border-secondary-300 rounded-md shadow-sm text-sm font-medium text-primary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 min-h-[44px] touch-manipulation order-2"
                >
                  Yeniden Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
