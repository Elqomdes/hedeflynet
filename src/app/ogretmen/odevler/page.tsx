'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Clock, Users, User, Calendar, Edit3, Trash2, ExternalLink, CheckCircle, Star, MessageSquare, Eye, Target, BookOpen, Zap } from 'lucide-react';

interface Attachment {
  type: 'pdf' | 'video' | 'link';
  url: string;
  name: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  type: 'individual' | 'class';
  dueDate: string;
  attachments: Attachment[];
  maxGrade?: number;
  classId?: {
    _id: string;
    name: string;
  };
  studentId?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  // Goal-like properties
  category?: 'academic' | 'behavioral' | 'skill' | 'personal' | 'other';
  priority?: 'low' | 'medium' | 'high';
  successCriteria?: string;
  progress?: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

interface Submission {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: 'completed' | 'incomplete' | 'not_started' | 'submitted' | 'graded' | 'late';
  grade?: number;
  maxGrade?: number;
  teacherFeedback?: string;
  submittedAt?: string;
  gradedAt?: string;
  content?: string;
  attachments?: {
    type: 'pdf' | 'video' | 'link' | 'image';
    url: string;
    name: string;
  }[];
}

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'individual' | 'class'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState<number>(0);
  const [teacherFeedback, setTeacherFeedback] = useState<string>('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'createdAt'>('dueDate');
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);
  const [allowLatePolicy, setAllowLatePolicy] = useState<'no' | 'untilClose' | 'always'>('untilClose');
  const [penaltyPercent, setPenaltyPercent] = useState<number>(0);

  useEffect(() => {
    fetchAssignments();
    fetchClasses();
    fetchStudents();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/teacher/assignments', {
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

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/teacher/classes', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        // Remove duplicate classes by name to prevent duplicate options
        const uniqueClasses = data.filter((classItem: any, index: number, self: any[]) => 
          index === self.findIndex(c => c.name === classItem.name)
        );
        setClasses(uniqueClasses);
      }
    } catch (error) {
      console.error('Classes fetch error:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/teacher/students', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Students fetch error:', error);
    }
  };


  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Bu ödevi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/assignments/${assignmentId}`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (response.ok) {
        // Remove locally and refresh from server to reflect any sibling deletions
        setAssignments(prev => prev.filter(a => a._id !== assignmentId));
        await fetchAssignments();
      }
    } catch (error) {
      console.error('Delete assignment error:', error);
    }
  };

  const fetchSubmissions = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/teacher/assignments/${assignmentId}/submissions`, {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Fetch submissions error:', error);
    }
  };

  const handleViewSubmissions = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    fetchSubmissions(assignment._id);
  };

  const handleGradeSubmission = async () => {
    if (!gradingSubmission) return;

    try {
      const response = await fetch(`/api/teacher/assignments/submissions/${gradingSubmission._id}/grade`, {
        method: 'PUT',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          grade: grade,
          teacherFeedback: teacherFeedback,
          status: 'graded'
        })
      });

      if (response.ok) {
        // Refresh submissions
        if (selectedAssignment) {
          fetchSubmissions(selectedAssignment._id);
        }
        setGradingSubmission(null);
        setGrade(0);
        setTeacherFeedback('');
        alert('Ödev başarıyla değerlendirildi');
      } else {
        const error = await response.json();
        alert(error.error || 'Değerlendirme yapılamadı');
      }
    } catch (error) {
      console.error('Grade submission error:', error);
      alert('Değerlendirme yapılamadı');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'late':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'graded':
        return 'Değerlendirildi';
      case 'submitted':
        return 'Teslim Edildi';
      case 'late':
        return 'Geç Teslim';
      case 'completed':
        return 'Tamamlandı';
      case 'incomplete':
        return 'Eksik';
      default:
        return 'Bekliyor';
    }
  };

  const filteredAssignments = assignments
    .filter(assignment => {
    if (filter === 'all') return true;
    return assignment.type === filter;
    })
    .filter(a => (showOnlyOverdue ? isOverdue(a.dueDate) : true))
    .sort((a, b) => new Date(a[sortBy]).getTime() - new Date(b[sortBy]).getTime());

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Ödevlerim</h1>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="block px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="dueDate">Teslim Tarihi</option>
            <option value="createdAt">Oluşturulma</option>
          </select>
          <label className="inline-flex items-center space-x-2 text-sm text-secondary-700">
            <input type="checkbox" checked={showOnlyOverdue} onChange={(e) => setShowOnlyOverdue(e.target.checked)} />
            <span>Sadece süresi geçmiş</span>
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="block px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Tümü</option>
            <option value="individual">Bireysel</option>
            <option value="class">Sınıf</option>
          </select>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ödev
          </button>
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Ödev bulunamadı</h3>
          <p className="mt-1 text-sm text-secondary-500">
            {filter === 'all' 
              ? 'Henüz bir ödev oluşturmadınız.'
              : 'Bu kategoride ödev bulunmuyor.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredAssignments.map((assignment) => (
            <div key={assignment._id} className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-primary-600" />
                    <h3 className="text-lg font-medium text-secondary-900">
                      {assignment.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      assignment.type === 'class' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {assignment.type === 'class' ? 'Sınıf Ödevi' : 'Bireysel Ödev'}
                    </span>
                    {isOverdue(assignment.dueDate) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Süresi Geçmiş
                      </span>
                    )}
                  </div>
                  
                  <p className="mt-2 text-sm text-secondary-600">
                    {assignment.description}
                  </p>
                  
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-secondary-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Teslim: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                    </div>
                    {assignment.type === 'class' && assignment.classId && (
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Sınıf: {assignment.classId.name}
                      </div>
                    )}
                    {assignment.type === 'individual' && assignment.studentId && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        Öğrenci: {assignment.studentId.firstName} {assignment.studentId.lastName}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Oluşturulma: {new Date(assignment.createdAt).toLocaleDateString('tr-TR')}
                    </div>
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
                </div>
                
                <div className="ml-4 flex space-x-2">
                  <button
                    onClick={() => handleViewSubmissions(assignment)}
                    className="p-2 text-blue-400 hover:text-blue-600"
                    title="Teslimleri Görüntüle"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingAssignment(assignment)}
                    className="p-2 text-secondary-400 hover:text-secondary-600"
                    title="Düzenle"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAssignment(assignment._id)}
                    className="p-2 text-red-400 hover:text-red-600"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Assignment Modal */}
      {(showCreateForm || editingAssignment) && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">
                {editingAssignment ? 'Ödevi Düzenle' : 'Yeni Ödev Oluştur'}
              </h3>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const assignmentData = {
                  title: formData.get('title'),
                  description: formData.get('description'),
                  type: formData.get('type'),
                  classId: formData.get('classId'),
                  studentId: formData.get('studentId'),
                  dueDate: formData.get('dueDate'),
                  maxGrade: formData.get('maxGrade') ? parseInt(formData.get('maxGrade') as string) : 100,
                  // Goal-like properties
                  category: formData.get('category') || 'academic',
                  priority: formData.get('priority') || 'medium',
                  successCriteria: formData.get('successCriteria') || '',
                  attachments: []
                };

                try {
                  const isEdit = Boolean(editingAssignment);
                  const url = isEdit ? `/api/teacher/assignments/${editingAssignment!._id}` : '/api/teacher/assignments';
                  const method = isEdit ? 'PUT' : 'POST';
                  const response = await fetch(url, {
                    method,
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(assignmentData)
                  });

                  if (response.ok) {
                    fetchAssignments(); // Refresh the list
                    setShowCreateForm(false);
                    setEditingAssignment(null);
                  } else {
                    const error = await response.json();
                    alert(error.error || 'Ödev oluşturulamadı');
                  }
                } catch (error) {
                  console.error('Assignment creation error:', error);
                  alert('Ödev oluşturulamadı');
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">
                      Başlık
                    </label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editingAssignment?.title || ''}
                      className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">
                      Açıklama
                    </label>
                    <textarea
                      name="description"
                      defaultValue={editingAssignment?.description || ''}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">
                      Ödev Türü
                    </label>
                    <select
                      name="type"
                      defaultValue={editingAssignment?.type || 'individual'}
                      className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="individual">Bireysel Ödev</option>
                      <option value="class">Sınıf Ödevi</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">
                      Teslim Tarihi
                    </label>
                    <input
                      type="datetime-local"
                      name="dueDate"
                      defaultValue={editingAssignment?.dueDate ? new Date(editingAssignment.dueDate).toISOString().slice(0, 16) : ''}
                      className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">
                      Maksimum Puan
                    </label>
                    <input
                      type="number"
                      name="maxGrade"
                      min="1"
                      max="100"
                      defaultValue={editingAssignment?.maxGrade || 100}
                      className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">
                      Sınıf (Sınıf Ödevi için)
                    </label>
                    <select
                      name="classId"
                      className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Sınıf seçin</option>
                      {classes.map((classItem) => (
                        <option key={classItem._id} value={classItem._id}>
                          {classItem.name} ({classItem.students?.length || 0} öğrenci)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">
                      Öğrenci (Bireysel Ödev için)
                    </label>
                    <select
                      name="studentId"
                      className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Öğrenci seçin</option>
                      {students.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.firstName} {student.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Goal-like properties */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-secondary-700 mb-3">Hedef Özellikleri</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">
                          Kategori
                        </label>
                        <select
                          name="category"
                          defaultValue={editingAssignment?.category || 'academic'}
                          className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="academic">Akademik</option>
                          <option value="behavioral">Davranışsal</option>
                          <option value="skill">Beceri</option>
                          <option value="personal">Kişisel</option>
                          <option value="other">Diğer</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">
                          Öncelik
                        </label>
                        <select
                          name="priority"
                          defaultValue={editingAssignment?.priority || 'medium'}
                          className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="low">Düşük</option>
                          <option value="medium">Orta</option>
                          <option value="high">Yüksek</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-secondary-700">
                        Başarı Kriterleri
                      </label>
                      <textarea
                        name="successCriteria"
                        defaultValue={editingAssignment?.successCriteria || ''}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Bu ödevin başarı kriterlerini açıklayın..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingAssignment(null);
                    }}
                    className="px-4 py-2 border border-secondary-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {editingAssignment ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-secondary-900">
                  {selectedAssignment.title} - Teslimler
                </h3>
                <button
                  onClick={() => {
                    setSelectedAssignment(null);
                    setSubmissions([]);
                  }}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <span className="sr-only">Kapat</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-secondary-400" />
                  <h3 className="mt-2 text-sm font-medium text-secondary-900">Henüz teslim yok</h3>
                  <p className="mt-1 text-sm text-secondary-500">
                    Bu ödev için henüz teslim edilmiş çalışma bulunmuyor.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission._id} className="bg-white border border-secondary-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-medium text-secondary-900">
                              {submission.studentId.firstName} {submission.studentId.lastName}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                              {getStatusText(submission.status)}
                            </span>
                            {submission.grade !== undefined && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                <Star className="h-3 w-3 mr-1" />
                                {submission.grade}/{submission.maxGrade || 100}
                              </span>
                            )}
                          </div>
                          
                          <p className="mt-1 text-sm text-secondary-600">
                            {submission.studentId.email}
                          </p>
                          
                          {submission.submittedAt && (
                            <p className="mt-1 text-sm text-secondary-500">
                              Teslim Tarihi: {new Date(submission.submittedAt).toLocaleString('tr-TR')}
                            </p>
                          )}
                          
                          {submission.content && (
                            <div className="mt-3">
                              <h5 className="text-sm font-medium text-secondary-900 mb-2">Ödev İçeriği:</h5>
                              <div className="bg-secondary-50 p-3 rounded-md">
                                <p className="text-sm text-secondary-700 whitespace-pre-wrap">{submission.content}</p>
                              </div>
                            </div>
                          )}
                          
                          {submission.teacherFeedback && (
                            <div className="mt-3">
                              <h5 className="text-sm font-medium text-secondary-900 mb-2">Geri Bildirimim:</h5>
                              <div className="bg-blue-50 p-3 rounded-md">
                                <p className="text-sm text-secondary-700 whitespace-pre-wrap">{submission.teacherFeedback}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                <div className="ml-4 flex space-x-2">
                          {submission.status === 'submitted' && (
                            <button
                              onClick={() => {
                                setGradingSubmission(submission);
                                setGrade(submission.grade || 0);
                                setTeacherFeedback(submission.teacherFeedback || '');
                              }}
                              className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Değerlendir
                            </button>
                          )}
                          {submission.status === 'graded' && (
                            <button
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/teacher/assignments/submissions/${submission._id}/reopen`, {
                                    method: 'PUT'
                                  });
                                  if (response.ok && selectedAssignment) {
                                    fetchSubmissions(selectedAssignment._id);
                                  }
                                } catch (error) {
                                  console.error('Reopen submission error:', error);
                                }
                              }}
                              className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-700 bg-secondary-100 hover:bg-secondary-200"
                            >
                              Yeniden Aç
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">
                Ödev Değerlendir - {gradingSubmission.studentId.firstName} {gradingSubmission.studentId.lastName}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">
                    Puan (0-{gradingSubmission.maxGrade || 100})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={gradingSubmission.maxGrade || 100}
                    value={grade}
                    onChange={(e) => setGrade(parseInt(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700">
                    Geri Bildirim
                  </label>
                  <textarea
                    value={teacherFeedback}
                    onChange={(e) => setTeacherFeedback(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Öğrenciye geri bildirim yazın..."
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setGradingSubmission(null);
                    setGrade(0);
                    setTeacherFeedback('');
                  }}
                  className="px-4 py-2 border border-secondary-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  İptal
                </button>
                <button
                  onClick={handleGradeSubmission}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <CheckCircle className="h-4 w-4 mr-2 inline" />
                  Değerlendir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
