'use client';

import { useState, useEffect } from 'react';
import { 
  Percent, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface Discount {
  _id: string;
  name: string;
  description: string;
  discountPercentage: number;
  planTypes: ('3months' | '6months' | '12months')[];
  isActive: boolean;
  startDate: string;
  endDate: string;
  maxUses?: number;
  currentUses: number;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface DiscountFormData {
  name: string;
  description: string;
  discountPercentage: number;
  planTypes: ('3months' | '6months' | '12months')[];
  startDate: string;
  endDate: string;
  maxUses?: number;
}

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [formData, setFormData] = useState<DiscountFormData>({
    name: '',
    description: '',
    discountPercentage: 0,
    planTypes: [],
    startDate: '',
    endDate: '',
    maxUses: undefined
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const response = await fetch('/api/admin/discounts');
      if (response.ok) {
        const data = await response.json();
        setDiscounts(data.discounts);
      }
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingDiscount 
        ? `/api/admin/discounts/${editingDiscount._id}`
        : '/api/admin/discounts';
      
      const method = editingDiscount ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchDiscounts();
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Failed to save discount:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleDelete = async (discountId: string) => {
    if (!confirm('Bu indirimi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/discounts/${discountId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchDiscounts();
      } else {
        const error = await response.json();
        alert(error.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Failed to delete discount:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      description: discount.description,
      discountPercentage: discount.discountPercentage,
      planTypes: discount.planTypes,
      startDate: new Date(discount.startDate).toISOString().split('T')[0],
      endDate: new Date(discount.endDate).toISOString().split('T')[0],
      maxUses: discount.maxUses
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discountPercentage: 0,
      planTypes: [],
      startDate: '',
      endDate: '',
      maxUses: undefined
    });
    setEditingDiscount(null);
    setShowForm(false);
  };

  const getStatusBadge = (discount: Discount) => {
    const now = new Date();
    const startDate = new Date(discount.startDate);
    const endDate = new Date(discount.endDate);

    if (!discount.isActive) {
      return <span className="badge badge-error">Pasif</span>;
    }

    if (now < startDate) {
      return <span className="badge badge-info">Bekliyor</span>;
    }

    if (now > endDate) {
      return <span className="badge badge-error">Süresi Dolmuş</span>;
    }

    if (discount.maxUses && discount.currentUses >= discount.maxUses) {
      return <span className="badge badge-warning">Limit Doldu</span>;
    }

    return <span className="badge badge-success">Aktif</span>;
  };

  const getPlanTypeText = (planType: string) => {
    const types = {
      '3months': '3 Aylık',
      '6months': '6 Aylık',
      '12months': '12 Aylık'
    };
    return types[planType as keyof typeof types] || planType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 mb-3">İndirim Yönetimi</h1>
            <p className="text-lg text-secondary-600">
              Abonelik indirimlerini oluşturun ve yönetin
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Yeni İndirim
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-xl">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-secondary-600">Aktif İndirim</p>
              <p className="text-2xl font-bold text-secondary-900">
                {discounts.filter(d => d.isActive && new Date(d.endDate) > new Date()).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-xl">
              <Percent className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-secondary-600">Toplam İndirim</p>
              <p className="text-2xl font-bold text-secondary-900">{discounts.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-secondary-600">Yakında Dolacak</p>
              <p className="text-2xl font-bold text-secondary-900">
                {discounts.filter(d => {
                  const daysLeft = Math.ceil((new Date(d.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return d.isActive && daysLeft <= 7 && daysLeft > 0;
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500 rounded-xl">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-secondary-600">Toplam Kullanım</p>
              <p className="text-2xl font-bold text-secondary-900">
                {discounts.reduce((sum, d) => sum + d.currentUses, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">
              {editingDiscount ? 'İndirimi Düzenle' : 'Yeni İndirim Oluştur'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  İndirim Adı
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Örn: Yaz İndirimi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="İndirim açıklaması..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  İndirim Yüzdesi
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Geçerli Planlar
                </label>
                <div className="space-y-2">
                  {[
                    { value: '3months', label: '3 Aylık' },
                    { value: '6months', label: '6 Aylık' },
                    { value: '12months', label: '12 Aylık' }
                  ].map((plan) => (
                    <label key={plan.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.planTypes.includes(plan.value as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              planTypes: [...formData.planTypes, plan.value as any]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              planTypes: formData.planTypes.filter(p => p !== plan.value)
                            });
                          }
                        }}
                        className="mr-3"
                      />
                      {plan.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Maksimum Kullanım (Opsiyonel)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUses || ''}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Sınırsız için boş bırakın"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingDiscount ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discounts Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200">
                <th className="text-left py-4 px-6 font-semibold text-secondary-900">İndirim</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-900">Yüzde</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-900">Planlar</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-900">Durum</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-900">Kullanım</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-900">Tarihler</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-900">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((discount) => (
                <tr key={discount._id} className="border-b border-secondary-100 hover:bg-secondary-50">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-semibold text-secondary-900">{discount.name}</div>
                      <div className="text-sm text-secondary-600">{discount.description}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-2xl font-bold text-green-600">
                      %{discount.discountPercentage}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1">
                      {discount.planTypes.map((planType) => (
                        <span key={planType} className="badge badge-info text-xs">
                          {getPlanTypeText(planType)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(discount)}
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-semibold text-secondary-900">
                        {discount.currentUses}
                        {discount.maxUses && ` / ${discount.maxUses}`}
                      </div>
                      {discount.maxUses && (
                        <div className="w-full bg-secondary-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary-500 h-2 rounded-full"
                            style={{ width: `${(discount.currentUses / discount.maxUses) * 100}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm">
                      <div className="flex items-center mb-1">
                        <Calendar className="w-4 h-4 text-secondary-400 mr-2" />
                        {new Date(discount.startDate).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-secondary-400 mr-2" />
                        {new Date(discount.endDate).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(discount)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(discount._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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

        {discounts.length === 0 && (
          <div className="text-center py-12">
            <Percent className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">Henüz indirim oluşturulmamış</p>
          </div>
        )}
      </div>
    </div>
  );
}
