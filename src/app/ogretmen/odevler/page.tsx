'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Clock, Users, User, Calendar, Edit3, Trash2, ExternalLink } from 'lucide-react';

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
  classId?: {
    _id: string;
    name: string;
  };
  studentId?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'individual' | 'class'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchAssignments();
    fetchClasses();
    fetchStudents();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/teacher/assignments');
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
      const response = await fetch('/api/teacher/classes');
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
      const response = await fetch('/api/teacher/students');
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
        method: 'DELETE'
      });

      if (response.ok) {
        setAssignments(assignments.filter(a => a._id !== assignmentId));
      }
    } catch (error) {
      console.error('Delete assignment error:', error);
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    return assignment.type === filter;
  });

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
                    onClick={() => setEditingAssignment(assignment)}
                    className="p-2 text-secondary-400 hover:text-secondary-600"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAssignment(assignment._id)}
                    className="p-2 text-red-400 hover:text-red-600"
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
                  attachments: []
                };

                try {
                  const response = await fetch('/api/teacher/assignments', {
                    method: 'POST',
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
    </div>
  );
}
