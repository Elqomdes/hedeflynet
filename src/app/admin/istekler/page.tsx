'use client';

import { useState, useEffect } from 'react';
import { FileText, Check, X, Eye, UserPlus, Pencil, Trash2 } from 'lucide-react';

interface TeacherApplication {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experience: string;
  subjects: string[];
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<TeacherApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    experience: '',
    subjects: '',
    message: '',
    status: 'pending' as 'pending' | 'approved' | 'rejected'
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/admin/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Applications fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    setActionLoading(applicationId);
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/approve`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchApplications();
        setShowModal(false);
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Approve error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    setActionLoading(applicationId);
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/reject`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchApplications();
        setShowModal(false);
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Reject error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const openEdit = (app: TeacherApplication) => {
    setSelectedApplication(app);
    setEditMode(true);
    setEditForm({
      firstName: app.firstName,
      lastName: app.lastName,
      email: app.email,
      phone: app.phone,
      experience: app.experience,
      subjects: app.subjects.join(', '),
      message: app.message,
      status: app.status
    });
  };

  const submitEdit = async () => {
    if (!selectedApplication) return;
    setActionLoading(selectedApplication._id);
    try {
      const response = await fetch(`/api/admin/applications/${selectedApplication._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm
        })
      });
      if (response.ok) {
        await fetchApplications();
        setEditMode(false);
        setSelectedApplication(null);
      }
    } catch (e) {
      console.error('Edit application error:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteApplication = async (app: TeacherApplication) => {
    if (!confirm('Başvuruyu silmek istediğinize emin misiniz?')) return;
    setActionLoading(app._id);
    try {
      const response = await fetch(`/api/admin/applications/${app._id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchApplications();
      }
    } catch (e) {
      console.error('Delete application error:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Bekliyor</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Onaylandı</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Reddedildi</span>;
      default:
        return null;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Öğretmen Başvuruları</h1>
        <p className="mt-2 text-secondary-600">
          Öğretmen başvurularını inceleyin ve yönetin
        </p>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Başvuru Sahibi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  İletişim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Branşlar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {applications.map((application) => (
                <tr key={application._id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-secondary-900">
                        {application.firstName} {application.lastName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">{application.email}</div>
                    <div className="text-sm text-secondary-500">{application.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">
                      {application.subjects.join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(application.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {new Date(application.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedApplication(application);
                        setShowModal(true);
                      }}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  <button
                    onClick={() => openEdit(application)}
                    className="text-secondary-600 hover:text-secondary-900 mr-3"
                    title="Düzenle"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteApplication(application)}
                    disabled={actionLoading === application._id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                    {application.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(application._id)}
                          disabled={actionLoading === application._id}
                          className="text-green-600 hover:text-green-900 mr-3 disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(application._id)}
                          disabled={actionLoading === application._id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Detail Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-secondary-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-secondary-900 mb-4">
                      Başvuru Detayları
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">Ad Soyad</label>
                        <p className="mt-1 text-sm text-secondary-900">
                          {selectedApplication.firstName} {selectedApplication.lastName}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">E-posta</label>
                        <p className="mt-1 text-sm text-secondary-900">{selectedApplication.email}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">Telefon</label>
                        <p className="mt-1 text-sm text-secondary-900">{selectedApplication.phone}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">Branşlar</label>
                        <p className="mt-1 text-sm text-secondary-900">
                          {selectedApplication.subjects.join(', ')}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">Deneyim</label>
                        <p className="mt-1 text-sm text-secondary-900">{selectedApplication.experience}</p>
                      </div>
                      
                      {selectedApplication.message && (
                        <div>
                          <label className="block text-sm font-medium text-secondary-700">Mesaj</label>
                          <p className="mt-1 text-sm text-secondary-900">{selectedApplication.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedApplication.status === 'pending' && (
                <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedApplication._id)}
                    disabled={actionLoading === selectedApplication._id}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {actionLoading === selectedApplication._id ? 'İşleniyor...' : 'Onayla'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(selectedApplication._id)}
                    disabled={actionLoading === selectedApplication._id}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-secondary-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-secondary-700 hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {actionLoading === selectedApplication._id ? 'İşleniyor...' : 'Reddet'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editMode && selectedApplication && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-secondary-500 bg-opacity-75 transition-opacity" onClick={() => setEditMode(false)} />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-secondary-900 mb-4">Başvuruyu Düzenle</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Ad</label>
                    <input className="input-field" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Soyad</label>
                    <input className="input-field" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">E-posta</label>
                    <input className="input-field" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Telefon</label>
                    <input className="input-field" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700">Deneyim</label>
                    <textarea className="input-field" rows={3} value={editForm.experience} onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700">Branşlar</label>
                    <input className="input-field" value={editForm.subjects} onChange={(e) => setEditForm({ ...editForm, subjects: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700">Mesaj</label>
                    <textarea className="input-field" rows={3} value={editForm.message} onChange={(e) => setEditForm({ ...editForm, message: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700">Durum</label>
                    <select className="input-field" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}>
                      <option value="pending">Bekliyor</option>
                      <option value="approved">Onaylandı</option>
                      <option value="rejected">Reddedildi</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={submitEdit}
                  disabled={actionLoading === selectedApplication._id}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {actionLoading === selectedApplication._id ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-secondary-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-secondary-700 hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
