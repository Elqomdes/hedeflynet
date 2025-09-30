'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Users, User, Calendar, Edit3, Trash2, UserPlus } from 'lucide-react';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
}

interface CoTeacher {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Class {
  _id: string;
  name: string;
  description?: string;
  teacherId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  coTeachers: CoTeacher[];
  students: Student[];
  createdAt: string;
  updatedAt: string;
}

export default function TeacherClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<CoTeacher[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedCoTeachers, setSelectedCoTeachers] = useState<string[]>([]);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchClasses();
    fetchAvailableUsers();
  }, []);

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/teacher/classes', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Sınıflar yüklenirken bir hata oluştu' });
      }
    } catch (error) {
      console.error('Classes fetch error:', error);
      setMessage({ type: 'error', text: 'Sınıflar yüklenirken bir hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const [studentsResponse, teachersResponse] = await Promise.all([
        fetch('/api/teacher/students', {
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        }),
        fetch('/api/admin/teachers', {
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        })
      ]);

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setAvailableStudents(studentsData);
      }

      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        setAvailableTeachers(teachersData);
      }
    } catch (error) {
      console.error('Available users fetch error:', error);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Bu sınıfı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve sınıfla ilgili tüm ödevler de silinecektir.')) {
      return;
    }

    setDeletingClassId(classId);
    setMessage(null);

    try {
      console.log('Deleting class with ID:', classId);
      const response = await fetch(`/api/teacher/classes/${classId}`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      console.log('Delete response status:', response.status);
      console.log('Delete response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Delete success result:', result);
        setClasses(classes.filter(c => c._id !== classId));
        setMessage({ type: 'success', text: result.message || 'Sınıf başarıyla silindi' });
      } else {
        const errorData = await response.json();
        console.error('Delete API Error:', errorData);
        setMessage({ type: 'error', text: errorData.error || 'Sınıf silinirken bir hata oluştu' });
      }
    } catch (error) {
      console.error('Delete class error:', error);
      setMessage({ type: 'error', text: 'Sınıf silinirken bir hata oluştu' });
    } finally {
      setDeletingClassId(null);
    }
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setSelectedStudents(classItem.students.map(s => s._id));
    setSelectedCoTeachers(classItem.coTeachers.map(t => t._id));
    setShowCreateForm(false);
  };

  const handleCreateClass = () => {
    setEditingClass(null);
    setSelectedStudents([]);
    setSelectedCoTeachers([]);
    setShowCreateForm(true);
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleCoTeacherToggle = (teacherId: string) => {
    setSelectedCoTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
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
        <h1 className="text-2xl font-bold text-secondary-900">Sınıflarım</h1>
        <button
          onClick={handleCreateClass}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Sınıf
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setMessage(null)}
                  className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-500 hover:bg-green-100 focus:ring-green-600'
                      : 'bg-red-50 text-red-500 hover:bg-red-100 focus:ring-red-600'
                  }`}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {classes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Sınıf bulunamadı</h3>
          <p className="mt-1 text-sm text-secondary-500">
            Henüz bir sınıf oluşturmadınız.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <div key={classItem._id} className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-primary-600" />
                    <h3 className="text-lg font-medium text-secondary-900">
                      {classItem.name}
                    </h3>
                  </div>
                  
                  {classItem.description && (
                    <p className="mt-2 text-sm text-secondary-600">
                      {classItem.description}
                    </p>
                  )}
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-secondary-500">
                      <User className="h-4 w-4 mr-2" />
                      <span>Öğretmen: {classItem.teacherId.firstName} {classItem.teacherId.lastName}</span>
                    </div>
                    
                    {classItem.coTeachers.length > 0 && (
                      <div className="flex items-center text-sm text-secondary-500">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Yardımcı Öğretmenler: {classItem.coTeachers.length}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-secondary-500">
                      <UserPlus className="h-4 w-4 mr-2" />
                      <span>Öğrenci Sayısı: {classItem.students.length}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-secondary-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Oluşturulma: {new Date(classItem.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>

                  {classItem.students.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-secondary-900 mb-2">Öğrenciler:</h4>
                      <div className="flex flex-wrap gap-1">
                        {classItem.students.slice(0, 3).map((student) => (
                          <span
                            key={student._id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800"
                          >
                            {student.firstName} {student.lastName}
                          </span>
                        ))}
                        {classItem.students.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                            +{classItem.students.length - 3} daha
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 flex space-x-2">
                  <button
                    onClick={() => handleEditClass(classItem)}
                    className="p-2 text-secondary-400 hover:text-secondary-600"
                    disabled={deletingClassId === classItem._id}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClass(classItem._id)}
                    className={`p-2 ${
                      deletingClassId === classItem._id
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-red-400 hover:text-red-600'
                    }`}
                    disabled={deletingClassId === classItem._id}
                  >
                    {deletingClassId === classItem._id ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Class Modal */}
      {(showCreateForm || editingClass) && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">
                {editingClass ? 'Sınıfı Düzenle' : 'Yeni Sınıf Oluştur'}
              </h3>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                
                // Form validation
                const name = formData.get('name') as string;
                const description = formData.get('description') as string;
                
                if (!name || name.trim().length === 0) {
                  setMessage({ type: 'error', text: 'Sınıf adı gereklidir' });
                  return;
                }
                
                if (name.trim().length > 100) {
                  setMessage({ type: 'error', text: 'Sınıf adı 100 karakterden uzun olamaz' });
                  return;
                }
                
                if (description && description.trim().length > 500) {
                  setMessage({ type: 'error', text: 'Açıklama 500 karakterden uzun olamaz' });
                  return;
                }
                
                const classData = {
                  name: name.trim(),
                  description: description ? description.trim() : '',
                  coTeacherIds: selectedCoTeachers,
                  studentIds: selectedStudents
                };

                try {
                  const url = editingClass 
                    ? `/api/teacher/classes/${editingClass._id}`
                    : '/api/teacher/classes';
                  const method = editingClass ? 'PUT' : 'POST';

                  console.log('Sending request to:', url);
                  console.log('Request data:', classData);

                  const response = await fetch(url, {
                    method,
                    credentials: 'include',
                    cache: 'no-store',
                    headers: {
                      'Content-Type': 'application/json',
                      'Cache-Control': 'no-cache',
                    },
                    body: JSON.stringify(classData)
                  });

                  console.log('Response status:', response.status);
                  console.log('Response ok:', response.ok);

                  if (response.ok) {
                    const result = await response.json();
                    console.log('Success result:', result);
                    setMessage({ type: 'success', text: editingClass ? 'Sınıf başarıyla güncellendi' : 'Sınıf başarıyla oluşturuldu' });
                    fetchClasses(); // Refresh the list
                    setShowCreateForm(false);
                    setEditingClass(null);
                    setSelectedStudents([]);
                    setSelectedCoTeachers([]);
                  } else {
                    const error = await response.json();
                    console.error('API Error:', error);
                    setMessage({ type: 'error', text: error.error || (editingClass ? 'Sınıf güncellenemedi' : 'Sınıf oluşturulamadı') });
                  }
                } catch (error) {
                  console.error('Class operation error:', error);
                  setMessage({ type: 'error', text: editingClass ? 'Sınıf güncellenemedi' : 'Sınıf oluşturulamadı' });
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">
                      Sınıf Adı
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingClass?.name || ''}
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
                      defaultValue={editingClass?.description || ''}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Yardımcı Öğretmenler
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-secondary-300 rounded-md p-2">
                      {availableTeachers.length === 0 ? (
                        <p className="text-sm text-secondary-500">Mevcut yardımcı öğretmen yok</p>
                      ) : (
                        availableTeachers.map((teacher) => (
                          <label key={teacher._id} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              checked={selectedCoTeachers.includes(teacher._id)}
                              onChange={() => handleCoTeacherToggle(teacher._id)}
                              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-secondary-700">
                              {teacher.firstName} {teacher.lastName}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Öğrenciler
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-secondary-300 rounded-md p-2">
                      {availableStudents.length === 0 ? (
                        <p className="text-sm text-secondary-500">Mevcut öğrenci yok</p>
                      ) : (
                        availableStudents.map((student) => (
                          <label key={student._id} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student._id)}
                              onChange={() => handleStudentToggle(student._id)}
                              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-secondary-700">
                              {student.firstName} {student.lastName}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingClass(null);
                      setSelectedStudents([]);
                      setSelectedCoTeachers([]);
                    }}
                    className="px-4 py-2 border border-secondary-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {editingClass ? 'Güncelle' : 'Oluştur'}
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
