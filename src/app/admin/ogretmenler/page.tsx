'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Mail, Phone, Plus, Pencil, Trash2, X, Eye } from 'lucide-react';
import Link from 'next/link';

interface Teacher {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<null | Teacher>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<null | Teacher>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/admin/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      }
    } catch (error) {
      console.error('Teachers fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (teacherId: string, currentStatus: boolean) => {
    setActionLoading(teacherId);
    try {
      const response = await fetch(`/api/admin/teachers/${teacherId}/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (response.ok) {
        await fetchTeachers();
      }
    } catch (error) {
      console.error('Toggle status error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const openAddModal = () => {
    setFormError(null);
    setFormData({ username: '', email: '', firstName: '', lastName: '', phone: '', password: '' });
    setShowAddModal(true);
  };

  const submitAddTeacher = async () => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      const response = await fetch('/api/admin/create-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setFormError(err.error || 'Kayıt başarısız');
        return;
      }
      setShowAddModal(false);
      await fetchTeachers();
    } catch (e) {
      setFormError('Sunucu hatası');
    } finally {
      setFormSubmitting(false);
    }
  };

  const openEditModal = (teacher: Teacher) => {
    setFormError(null);
    setFormData({
      username: teacher.username,
      email: teacher.email,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      phone: teacher.phone || '',
      password: ''
    });
    setShowEditModal(teacher);
  };

  const submitEditTeacher = async () => {
    if (!showEditModal) return;
    setFormSubmitting(true);
    setFormError(null);
    try {
      const payload: any = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      };
      if (formData.password && formData.password.length >= 6) {
        payload.password = formData.password;
      }
      const response = await fetch(`/api/admin/teachers/${showEditModal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setFormError(err.error || 'Güncelleme başarısız');
        return;
      }
      setShowEditModal(null);
      await fetchTeachers();
    } catch (e) {
      setFormError('Sunucu hatası');
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmDeleteTeacher = async () => {
    if (!deleteCandidate) return;
    setActionLoading(deleteCandidate._id);
    try {
      const response = await fetch(`/api/admin/teachers/${deleteCandidate._id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        console.error('Delete failed');
      } else {
        await fetchTeachers();
      }
    } catch (e) {
      console.error('Delete teacher error:', e);
    } finally {
      setActionLoading(null);
      setDeleteCandidate(null);
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
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Öğretmenler</h1>
        <p className="mt-2 text-sm sm:text-base text-secondary-600">
          Sistemdeki öğretmenleri yönetin ve durumlarını kontrol edin
        </p>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-secondary-200 gap-4">
          <div className="font-semibold text-secondary-900 text-base sm:text-lg">Öğretmen Listesi</div>
          <button onClick={openAddModal} className="inline-flex items-center px-3 sm:px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 min-h-[44px] touch-manipulation">
            <Plus className="h-4 w-4 mr-2" />Yeni Öğretmen
          </button>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Öğretmen
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider hidden sm:table-cell">
                  İletişim
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider hidden md:table-cell">
                  Kullanıcı Adı
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider hidden lg:table-cell">
                  Kayıt Tarihi
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {teachers.map((teacher) => (
                <tr key={teacher._id} className="hover:bg-secondary-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-secondary-900">
                          {teacher.firstName} {teacher.lastName}
                        </div>
                      </div>
                      <div className="sm:hidden mt-2 text-xs text-secondary-500">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {teacher.email}
                        </div>
                        {teacher.phone && (
                          <div className="flex items-center mt-1">
                            <Phone className="h-3 w-3 mr-1" />
                            {teacher.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="flex items-center text-sm text-secondary-900">
                      <Mail className="h-4 w-4 mr-2 text-secondary-400" />
                      {teacher.email}
                    </div>
                    {teacher.phone && (
                      <div className="flex items-center text-sm text-secondary-500 mt-1">
                        <Phone className="h-4 w-4 mr-2 text-secondary-400" />
                        {teacher.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-secondary-900">{teacher.username}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {teacher.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                        Pasif
                      </span>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-secondary-500 hidden lg:table-cell">
                    {new Date(teacher.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/ogretmenler/${teacher._id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Detayları Görüntüle"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(teacher._id, teacher.isActive)}
                        disabled={actionLoading === teacher._id}
                        className={`disabled:opacity-50 ${
                          teacher.isActive
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={teacher.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                      >
                        {actionLoading === teacher._id ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : teacher.isActive ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(teacher)}
                        className="text-secondary-600 hover:text-secondary-900"
                        title="Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteCandidate(teacher)}
                        className="text-red-600 hover:text-red-800"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {teachers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Öğretmen bulunamadı</h3>
          <p className="mt-1 text-sm text-secondary-500">
            Henüz sistemde kayıtlı öğretmen bulunmuyor.
          </p>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-base sm:text-lg font-semibold">Yeni Öğretmen Ekle</h3>
              <button onClick={() => setShowAddModal(false)} className="text-secondary-500 hover:text-secondary-800 min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-4 sm:px-6 py-4 space-y-4">
              {formError && <div className="text-sm text-red-600">{formError}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-secondary-600">Ad</label>
                  <input className="input-field" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-secondary-600">Soyad</label>
                  <input className="input-field" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-secondary-600">E-posta</label>
                  <input className="input-field" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-secondary-600">Telefon</label>
                  <input className="input-field" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-secondary-600">Kullanıcı Adı</label>
                  <input className="input-field" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-secondary-600">Şifre</label>
                  <input className="input-field" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary min-h-[44px] touch-manipulation order-2 sm:order-1">Vazgeç</button>
              <button onClick={submitAddTeacher} disabled={formSubmitting} className="btn-primary min-h-[44px] touch-manipulation order-1 sm:order-2">
                {formSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-base sm:text-lg font-semibold">Öğretmen Düzenle</h3>
              <button onClick={() => setShowEditModal(null)} className="text-secondary-500 hover:text-secondary-800 min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-4 sm:px-6 py-4 space-y-4">
              {formError && <div className="text-sm text-red-600">{formError}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-secondary-600">Ad</label>
                  <input className="input-field" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-secondary-600">Soyad</label>
                  <input className="input-field" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-secondary-600">E-posta</label>
                  <input className="input-field" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-secondary-600">Telefon</label>
                  <input className="input-field" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-secondary-600">Kullanıcı Adı</label>
                  <input className="input-field" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-secondary-600">Şifre (değiştirmek için)</label>
                  <input className="input-field" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowEditModal(null)} className="btn-secondary min-h-[44px] touch-manipulation order-2 sm:order-1">Vazgeç</button>
              <button onClick={submitEditTeacher} disabled={formSubmitting} className="btn-primary min-h-[44px] touch-manipulation order-1 sm:order-2">
                {formSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="px-4 sm:px-6 py-4 border-b">
              <h3 className="text-base sm:text-lg font-semibold">Öğretmeni silmek istediğinize emin misiniz?</h3>
            </div>
            <div className="px-4 sm:px-6 py-4 text-sm text-secondary-700">
              <p>
                {deleteCandidate.firstName} {deleteCandidate.lastName} ({deleteCandidate.username}) kalıcı olarak silinecek.
              </p>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button onClick={() => setDeleteCandidate(null)} className="btn-secondary min-h-[44px] touch-manipulation order-2 sm:order-1">Vazgeç</button>
              <button onClick={confirmDeleteTeacher} disabled={actionLoading === deleteCandidate._id} className="btn-danger min-h-[44px] touch-manipulation order-1 sm:order-2">
                {actionLoading === deleteCandidate._id ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
