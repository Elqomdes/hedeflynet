'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Users, Search, Plus, Edit, Trash2, Eye, Phone, Mail, User, UserMinus, UserX } from 'lucide-react';

interface Parent {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  children: string[];
  isActive: boolean;
  createdAt: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
        setParents(data.parents || []);
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
        setStudents(data.students || []);
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
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Veli Ekle
        </button>
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
                    Çocuk Sayısı
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {parent.children.length} çocuk
                        </span>
                        <button
                          onClick={() => {
                            setSelectedParent(parent);
                            setShowAddChildModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-150"
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
                          onClick={() => {/* View parent details */}}
                          className="text-primary-600 hover:text-primary-900 transition-colors duration-150"
                          title="Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {/* Edit parent */}}
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                    <div key={student._id} className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg">
                      <div>
                        <div className="font-medium text-secondary-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-secondary-500">{student.email}</div>
                      </div>
                      <button
                        onClick={() => handleAddChild(student._id)}
                        className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors duration-150"
                      >
                        Ekle
                      </button>
                    </div>
                  ))}
                
                {students.filter(student => !selectedParent.children.includes(student._id)).length === 0 && (
                  <div className="text-center py-8 text-secondary-500">
                    Eklenebilecek öğrenci yok
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
