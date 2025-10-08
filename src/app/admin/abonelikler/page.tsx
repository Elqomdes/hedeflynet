'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Filter,
  Search
} from 'lucide-react';

interface Subscription {
  _id: string;
  teacherId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  planType: '3months' | '6months' | '12months';
  startDate: string;
  endDate: string;
  isActive: boolean;
  isFreeTrial: boolean;
  originalPrice: number;
  discountedPrice?: number;
  discountPercentage?: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
}

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'free'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'active' && sub.isActive && new Date(sub.endDate) > new Date()) ||
      (filter === 'expired' && (!sub.isActive || new Date(sub.endDate) <= new Date())) ||
      (filter === 'free' && sub.isFreeTrial);
    
    const matchesSearch = 
      sub.teacherId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.teacherId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.teacherId.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (subscription: Subscription) => {
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (subscription.isFreeTrial) {
      return <span className="badge badge-info">Ücretsiz Deneme</span>;
    }

    if (!subscription.isActive) {
      return <span className="badge badge-error">Pasif</span>;
    }

    if (endDate <= now) {
      return <span className="badge badge-error">Süresi Dolmuş</span>;
    }

    if (daysLeft <= 7) {
      return <span className="badge badge-warning">Yakında Dolacak</span>;
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

  const getPaymentStatusBadge = (status: string) => {
    const statuses = {
      pending: { text: 'Bekliyor', class: 'badge-warning' },
      paid: { text: 'Ödendi', class: 'badge-success' },
      failed: { text: 'Başarısız', class: 'badge-error' },
      refunded: { text: 'İade Edildi', class: 'badge-info' }
    };
    const statusInfo = statuses[status as keyof typeof statuses];
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>;
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
        <h1 className="text-4xl font-bold text-secondary-900 mb-3">Abonelik Yönetimi</h1>
        <p className="text-lg text-secondary-600">
          Öğretmen aboneliklerini takip edin ve yönetin
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-xl">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-secondary-600">Aktif Abonelik</p>
              <p className="text-2xl font-bold text-secondary-900">
                {subscriptions.filter(s => s.isActive && new Date(s.endDate) > new Date()).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-xl">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-secondary-600">Toplam Abonelik</p>
              <p className="text-2xl font-bold text-secondary-900">{subscriptions.length}</p>
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
                {subscriptions.filter(s => {
                  const daysLeft = Math.ceil((new Date(s.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return s.isActive && daysLeft <= 7 && daysLeft > 0;
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500 rounded-xl">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-secondary-600">Ücretsiz Deneme</p>
              <p className="text-2xl font-bold text-secondary-900">
                {subscriptions.filter(s => s.isFreeTrial).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Öğretmen ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Tümü' },
              { key: 'active', label: 'Aktif' },
              { key: 'expired', label: 'Süresi Dolmuş' },
              { key: 'free', label: 'Ücretsiz' }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === filterOption.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200">
                <th className="text-left py-4 px-6 font-semibold text-secondary-900">Öğretmen</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-900">Plan</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-900">Durum</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-900">Ödeme</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-900">Bitiş Tarihi</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-900">Kalan Gün</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-900">Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((subscription) => {
                const daysLeft = Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={subscription._id} className="border-b border-secondary-100 hover:bg-secondary-50">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-semibold text-secondary-900">
                          {subscription.teacherId.firstName} {subscription.teacherId.lastName}
                        </div>
                        <div className="text-sm text-secondary-600">{subscription.teacherId.email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-secondary-900">
                        {getPlanTypeText(subscription.planType)}
                      </div>
                      {subscription.isFreeTrial && (
                        <div className="text-sm text-blue-600">Ücretsiz Deneme</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(subscription)}
                    </td>
                    <td className="py-4 px-6">
                      {getPaymentStatusBadge(subscription.paymentStatus)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-secondary-400 mr-2" />
                        {new Date(subscription.endDate).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`flex items-center ${daysLeft <= 7 ? 'text-red-600' : daysLeft <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                        <Clock className="w-4 h-4 mr-2" />
                        {daysLeft > 0 ? `${daysLeft} gün` : 'Süresi dolmuş'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        {subscription.discountedPrice ? (
                          <div>
                            <div className="text-sm text-secondary-400 line-through">
                              ₺{subscription.originalPrice}
                            </div>
                            <div className="font-semibold text-secondary-900">
                              ₺{subscription.discountedPrice}
                            </div>
                            {subscription.discountPercentage && (
                              <div className="text-sm text-green-600">
                                %{subscription.discountPercentage} indirim
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="font-semibold text-secondary-900">
                            ₺{subscription.originalPrice}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">Abonelik bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  );
}
