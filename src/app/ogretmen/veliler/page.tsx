'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Users, Search, Plus, Edit, Trash2, Eye, Phone, Mail, User, UserMinus, UserX, GraduationCap, ChevronDown, ChevronRight } from 'lucide-react';

interface Parent {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  children: string[];
  childrenDetails?: Student[];
  isActive: boolean;
  createdAt: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  classId?: string;
  className?: string;
}

interface NewParent {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  children: string[];
}

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [newParent, setNewParent] = useState<NewParent>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    children: []
  });

  useEffect(() => {
    fetchParents();
    fetchStudents();
  }, []);

  const fetchParents = async () => {
    try {
      const response = await fetch('/api/teacher/parents', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Parents API Response:', data);
        console.log('Total parents received:', data.parents?.length || 0);
        if (data.parents && data.parents.length > 0) {
          console.log('First parent:', data.parents[0]);
        }
        setParents(data.parents || []);
      } else {
        const errorData = await response.json();
        console.error('Fetch parents failed:', response.status, errorData);
        alert('Veli listesi yüklenirken bir hata oluştu: ' + (errorData.error || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Fetch parents error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/teacher/students', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data || []);
      } else {
        console.error('Fetch students failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Fetch students error:', error);
    }
  };

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Submitting parent data:', newParent);
      
      const response = await fetch('/api/teacher/parents', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(newParent),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Parent created successfully:', result);
        await fetchParents();
        setShowAddModal(false);
        setNewParent({
          username: '',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          phone: '',
          children: []
        });
        alert('Veli başarıyla eklendi!');
      } else {
        const error = await response.json();
        console.error('API Error:', error);
        alert(error.error || 'Veli eklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Add parent error:', error);
      alert('Veli eklenirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteParent = async (parentId: string) => {
    if (!confirm('Bu veliyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/parents/${parentId}`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        await fetchParents();
        alert('Veli başarıyla silindi!');
      } else {
        const error = await response.json();
        alert(error.error || 'Veli silinirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Delete parent error:', error);
      alert('Veli silinirken bir hata oluştu');
    }
  };

  const handleAddChild = async (studentId: string) => {
    if (!selectedParent) return;

    try {
      const response = await fetch(`/api/teacher/parents/${selectedParent._id}/children`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ studentId }),
      });

      if (response.ok) {
        await fetchParents();
        setShowAddChildModal(false);
        setSelectedParent(null);
        alert('Öğrenci veliye başarıyla eklendi!');
      } else {
        const error = await response.json();
        alert(error.error || 'Öğrenci eklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Add child error:', error);
      alert('Öğrenci eklenirken bir hata oluştu');
    }
  };

  const handleRemoveChild = async (parentId: string, studentId: string) => {
    if (!confirm('Bu öğrenciyi veliden çıkarmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/parents/${parentId}/children?studentId=${studentId}`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        await fetchParents();
        alert('Öğrenci veliden başarıyla çıkarıldı!');
      } else {
        const error = await response.json();
        alert(error.error || 'Öğrenci çıkarılırken bir hata oluştu');
      }
    } catch (error) {
      console.error('Remove child error:', error);
      alert('Öğrenci çıkarılırken bir hata oluştu');
    }
  };

  const handleViewParent = (parent: Parent) => {
    setSelectedParent(parent);
    setShowViewModal(true);
  };

  const handleEditParent = (parent: Parent) => {
    setEditingParent(parent);
    setShowEditModal(true);
  };

  const handleUpdateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/teacher/parents/${editingParent._id}`, {
        method: 'PUT',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          firstName: editingParent.firstName,
          lastName: editingParent.lastName,
          email: editingParent.email,
          phone: editingParent.phone,
        }),
      });

      if (response.ok) {
        await fetchParents();
        setShowEditModal(false);
        setEditingParent(null);
        alert('Veli bilgileri başarıyla güncellendi!');
      } else {
        const error = await response.json();
        alert(error.error || 'Veli güncellenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Update parent error:', error);
      alert('Veli güncellenirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleParentExpansion = (parentId: string) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
  };

  const filteredParents = parents.filter(parent =>
    parent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Veli Yönetimi</h1>
        <p className="text-secondary-600">Öğrenci velilerini yönetin ve takip edin</p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Veli ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Veli Ekle
          </button>
        </div>
      </div>

      {/* Parents List */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
        {filteredParents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Henüz veli yok</h3>
            <p className="text-secondary-600 mb-4">İlk veliyi eklemek için yukarıdaki butona tıklayın</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 border-b border-secondary-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Veli Bilgileri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    İletişim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Öğrenciler
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredParents.map((parent) => (
                  <>
                    <tr key={parent._id} className="hover:bg-secondary-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-secondary-900">
                              {parent.firstName} {parent.lastName}
                            </div>
                            <div className="text-sm text-secondary-500">
                              @{parent.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary-900 flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-secondary-400" />
                          {parent.email}
                        </div>
                        {parent.phone && (
                          <div className="text-sm text-secondary-500 flex items-center mt-1">
                            <Phone className="w-4 h-4 mr-2 text-secondary-400" />
                            {parent.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <GraduationCap className="w-3 h-3 mr-1" />
                              {parent.children.length} öğrenci
                            </span>
                            {parent.children.length > 0 && (
                              <button
                                onClick={() => toggleParentExpansion(parent._id)}
                                className="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1"
                                title={expandedParents.has(parent._id) ? "Öğrencileri Gizle" : "Öğrencileri Göster"}
                              >
                                {expandedParents.has(parent._id) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedParent(parent);
                              setShowAddChildModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150 p-1"
                            title="Öğrenci Ekle"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          parent.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {parent.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewParent(parent)}
                            className="text-primary-600 hover:text-primary-900 transition-colors duration-150"
                            title="Görüntüle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditParent(parent)}
                            className="text-secondary-600 hover:text-secondary-900 transition-colors duration-150"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteParent(parent._id)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded Student Details */}
                    {expandedParents.has(parent._id) && parent.childrenDetails && parent.childrenDetails.length > 0 && (
                      <tr className="bg-blue-50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-secondary-900 flex items-center">
                              <GraduationCap className="w-4 h-4 mr-2 text-blue-600" />
                              Bağlı Öğrenciler
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {parent.childrenDetails.map((student: Student) => (
                                <div key={student._id} className="bg-white rounded-lg border border-blue-200 p-3 flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                      <GraduationCap className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-secondary-900">
                                        {student.firstName} {student.lastName}
                                      </div>
                                      <div className="text-xs text-secondary-500">
                                        {student.email}
                                      </div>
                                      {student.className && (
                                        <div className="text-xs text-blue-600">
                                          {student.className}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveChild(parent._id, student._id)}
                                    className="text-red-500 hover:text-red-700 transition-colors duration-150 p-1"
                                    title="Öğrenciyi Çıkar"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Parent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-secondary-900">Yeni Veli Ekle</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-secondary-400 hover:text-secondary-600 transition-colors duration-150"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddParent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Ad *
                    </label>
                    <input
                      type="text"
                      required
                      value={newParent.firstName}
                      onChange={(e) => setNewParent({ ...newParent, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ad"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Soyad *
                    </label>
                    <input
                      type="text"
                      required
                      value={newParent.lastName}
                      onChange={(e) => setNewParent({ ...newParent, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Soyad"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Kullanıcı Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={newParent.username}
                    onChange={(e) => setNewParent({ ...newParent, username: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="kullanici_adi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    E-posta *
                  </label>
                  <input
                    type="email"
                    required
                    value={newParent.email}
                    onChange={(e) => setNewParent({ ...newParent, email: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="ornek@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Şifre *
                  </label>
                  <input
                    type="password"
                    required
                    value={newParent.password}
                    onChange={(e) => setNewParent({ ...newParent, password: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="En az 6 karakter"
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={newParent.phone}
                    onChange={(e) => setNewParent({ ...newParent, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0555 123 45 67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Öğrenciler (İsteğe Bağlı)
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-secondary-200 rounded-lg p-3">
                    {students.map((student) => (
                      <label key={student._id} className="flex items-center space-x-3 cursor-pointer hover:bg-secondary-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={newParent.children.includes(student._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewParent({
                                ...newParent,
                                children: [...newParent.children, student._id]
                              });
                            } else {
                              setNewParent({
                                ...newParent,
                                children: newParent.children.filter(id => id !== student._id)
                              });
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                        />
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="text-sm font-medium text-secondary-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-xs text-secondary-500">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                    {students.length === 0 && (
                      <div className="text-center py-4 text-secondary-500 text-sm">
                        Henüz öğrenci yok
                      </div>
                    )}
                  </div>
                  {newParent.children.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-secondary-600 mb-1">Seçilen öğrenciler:</div>
                      <div className="flex flex-wrap gap-1">
                        {newParent.children.map((childId) => {
                          const student = students.find(s => s._id === childId);
                          return student ? (
                            <span key={childId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {student.firstName} {student.lastName}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-secondary-700 bg-secondary-100 rounded-lg hover:bg-secondary-200 transition-colors duration-150"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                  >
                    {isSubmitting ? 'Ekleniyor...' : 'Veli Ekle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Child Modal */}
      {showAddChildModal && selectedParent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-secondary-900">
                  {selectedParent.firstName} {selectedParent.lastName} - Öğrenci Ekle
                </h2>
                <button
                  onClick={() => {
                    setShowAddChildModal(false);
                    setSelectedParent(null);
                  }}
                  className="text-secondary-400 hover:text-secondary-600 transition-colors duration-150"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {students
                  .filter(student => !selectedParent.children.includes(student._id))
                  .map((student) => (
                    <div key={student._id} className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors duration-150">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-secondary-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-secondary-500">{student.email}</div>
                          {student.className && (
                            <div className="text-xs text-blue-600">
                              {student.className}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddChild(student._id)}
                        className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors duration-150 flex items-center space-x-1"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Ekle</span>
                      </button>
                    </div>
                  ))}
                
                {students.filter(student => !selectedParent.children.includes(student._id)).length === 0 && (
                  <div className="text-center py-12">
                    <GraduationCap className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-secondary-900 mb-2">Eklenebilecek öğrenci yok</h3>
                    <p className="text-secondary-600">Tüm öğrenciler zaten bu veliye bağlı</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Parent Modal */}
      {showViewModal && selectedParent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-secondary-900">
                  Veli Detayları
                </h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedParent(null);
                  }}
                  className="text-secondary-400 hover:text-secondary-600 transition-colors duration-150"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-secondary-900">
                      {selectedParent.firstName} {selectedParent.lastName}
                    </h3>
                    <p className="text-sm text-secondary-500">@{selectedParent.username}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-secondary-400" />
                    <div>
                      <p className="text-sm font-medium text-secondary-700">E-posta</p>
                      <p className="text-sm text-secondary-900">{selectedParent.email}</p>
                    </div>
                  </div>

                  {selectedParent.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-secondary-400" />
                      <div>
                        <p className="text-sm font-medium text-secondary-700">Telefon</p>
                        <p className="text-sm text-secondary-900">{selectedParent.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <GraduationCap className="w-5 h-5 text-secondary-400" />
                    <div>
                      <p className="text-sm font-medium text-secondary-700">Öğrenci Sayısı</p>
                      <p className="text-sm text-secondary-900">{selectedParent.children.length} öğrenci</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <div className={`w-3 h-3 rounded-full ${selectedParent.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-secondary-700">Durum</p>
                      <p className="text-sm text-secondary-900">{selectedParent.isActive ? 'Aktif' : 'Pasif'}</p>
                    </div>
                  </div>
                </div>

                {selectedParent.childrenDetails && selectedParent.childrenDetails.length > 0 && (
                  <div className="pt-4 border-t border-secondary-200">
                    <h4 className="text-sm font-medium text-secondary-900 mb-3">Bağlı Öğrenciler</h4>
                    <div className="space-y-2">
                      {selectedParent.childrenDetails.map((student: Student) => (
                        <div key={student._id} className="flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <GraduationCap className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-secondary-900">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-xs text-secondary-500">{student.email}</p>
                            {student.className && (
                              <p className="text-xs text-blue-600">{student.className}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Parent Modal */}
      {showEditModal && editingParent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-secondary-900">Veli Düzenle</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingParent(null);
                  }}
                  className="text-secondary-400 hover:text-secondary-600 transition-colors duration-150"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateParent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Ad *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingParent.firstName}
                      onChange={(e) => setEditingParent({ ...editingParent, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ad"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Soyad *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingParent.lastName}
                      onChange={(e) => setEditingParent({ ...editingParent, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Soyad"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    E-posta *
                  </label>
                  <input
                    type="email"
                    required
                    value={editingParent.email}
                    onChange={(e) => setEditingParent({ ...editingParent, email: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="ornek@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={editingParent.phone}
                    onChange={(e) => setEditingParent({ ...editingParent, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0555 123 45 67"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingParent(null);
                    }}
                    className="px-4 py-2 text-secondary-700 bg-secondary-100 rounded-lg hover:bg-secondary-200 transition-colors duration-150"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                  >
                    {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
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
