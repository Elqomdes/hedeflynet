'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowRight, 
  Users, 
  BookOpen, 
  FileText, 
  Target, 
  BarChart3, 
  Video, 
  Shield, 
  CheckCircle, 
  TrendingUp,
  Clock,
  Award,
  MessageSquare,
  UserCheck,
  GraduationCap,
  Gift,
  Star,
  CreditCard,
  Zap,
  Crown
} from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  email: string;
  phone?: string;
}

interface FreeTeacherSlotData {
  totalSlots: number;
  usedSlots: number;
  availableSlots: number;
  recentAssignments: Array<{
    slotNumber: number;
    teacherName: string;
    assignedAt: string;
  }>;
}

interface PricingPlan {
  id: string;
  name: string;
  duration: string;
  price: number;
  originalPrice: number;
  discountPercentage?: number;
  discountName?: string;
  features: string[];
  popular: boolean;
}

interface PricingData {
  plans: PricingPlan[];
  activeDiscounts: Array<{
    id: string;
    name: string;
    description: string;
    discountPercentage: number;
    endDate: string;
  }>;
}

// Free Teacher Progress Section Component
function FreeTeacherProgressSection() {
  const [slotData, setSlotData] = useState<FreeTeacherSlotData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlotData = async () => {
      try {
        const response = await fetch('/api/free-teacher-slots');
        if (response.ok) {
          const data = await response.json();
          setSlotData(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch free teacher slots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlotData();
  }, []);

  if (loading || !slotData) {
    return (
      <section className="py-16 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const progressPercentage = (slotData.usedSlots / slotData.totalSlots) * 100;

  return (
    <section className="py-16 bg-gradient-to-r from-green-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-lg">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
            İlk 50 Öğretmen Ücretsiz!
          </h2>
          <p className="text-lg text-secondary-600 max-w-3xl mx-auto">
            Platformumuzun açılışında ilk 50 öğretmenimize 1 yıl boyunca ücretsiz erişim imkanı sunuyoruz.
            Hemen başvurun ve bu fırsattan yararlanın!
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-secondary-900">İlerleme Durumu</h3>
                <span className="text-2xl font-bold text-green-600">
                  {slotData.usedSlots}/{slotData.totalSlots}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-6 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-secondary-600">
                <span>Kullanılan: {slotData.usedSlots}</span>
                <span>Kalan: {slotData.availableSlots}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600 mb-2">{slotData.usedSlots}</div>
                <div className="text-sm text-secondary-600">Kullanılan Slot</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="text-3xl font-bold text-blue-600 mb-2">{slotData.availableSlots}</div>
                <div className="text-sm text-secondary-600">Kalan Slot</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Assignments */}
        {slotData.recentAssignments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-secondary-900 mb-6 text-center">
              Son Atanan Öğretmenler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slotData.recentAssignments.map((assignment, index) => (
                <div key={index} className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-secondary-900">{assignment.teacherName}</div>
                    <div className="text-sm text-secondary-600">Slot #{assignment.slotNumber}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-8">
          <Link 
            href="/giris" 
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Gift className="w-5 h-5 mr-2" />
            Ücretsiz Başvuru Yap
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Pricing Section Component
function PricingSection() {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        const response = await fetch('/api/pricing');
        if (response.ok) {
          const data = await response.json();
          setPricingData(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch pricing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPricingData();
  }, []);

  if (loading || !pricingData) {
    return (
      <section className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl mb-6 shadow-lg">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-secondary-900 mb-4">
            Abonelik Planları
          </h2>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
            İhtiyaçlarınıza uygun abonelik planını seçin ve öğrenci koçluğunuzu bir üst seviyeye taşıyın
          </p>
        </div>

        {/* Active Discounts Banner */}
        {pricingData.activeDiscounts.length > 0 && (
          <div className="mb-12">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-6 text-white text-center shadow-xl">
              <div className="flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 mr-3" />
                <h3 className="text-2xl font-bold">Özel İndirimler!</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pricingData.activeDiscounts.map((discount) => (
                  <div key={discount.id} className="bg-white/20 rounded-xl p-4">
                    <div className="font-bold text-lg">{discount.name}</div>
                    <div className="text-sm opacity-90">{discount.description}</div>
                    <div className="text-2xl font-bold mt-2">%{discount.discountPercentage} İndirim</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingData.plans.map((plan, index) => (
            <div 
              key={plan.id} 
              className={`relative bg-white rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                plan.popular ? 'ring-2 ring-primary-500 transform scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center">
                    <Crown className="w-4 h-4 mr-2" />
                    En Popüler
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-secondary-900 mb-2">{plan.name}</h3>
                <p className="text-secondary-600 mb-4">{plan.duration}</p>
                
                <div className="mb-4">
                  {plan.discountPercentage && (
                    <div className="text-sm text-red-600 font-semibold mb-2">
                      %{plan.discountPercentage} İndirim - {plan.discountName}
                    </div>
                  )}
                  <div className="flex items-center justify-center">
                    {plan.discountPercentage && (
                      <span className="text-2xl text-secondary-400 line-through mr-3">
                        ₺{plan.originalPrice}
                      </span>
                    )}
                    <span className="text-4xl font-bold text-primary-600">
                      ₺{plan.price}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-500 mt-2">aylık</p>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-secondary-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link 
                href="/giris" 
                className={`w-full py-3 px-6 rounded-xl font-semibold text-center transition-all duration-300 ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700' 
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Planı Seç
              </Link>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-secondary-600 mb-4">
            Tüm planlar 7 gün ücretsiz deneme ile gelir
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-secondary-500">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              İstediğiniz zaman iptal
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Güvenli ödeme
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              24/7 destek
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Cache busting for dynamic content
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Handle redirects after user data is loaded
  useEffect(() => {
    if (!loading && user && mounted) {
      const redirectPath = {
        'admin': '/admin',
        'teacher': '/ogretmen',
        'student': '/ogrenci',
        'parent': '/veli'
      }[user.role];
      
      if (redirectPath) {
        router.push(redirectPath);
      }
    }
  }, [user, loading, mounted, router]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If user is logged in, show loading while redirecting
  if (user && mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If user is not logged in, show public homepage
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50">

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-transparent to-secondary-500/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <span className="text-white font-bold text-3xl">H</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold text-secondary-900 mb-6 bg-gradient-to-r from-secondary-900 via-primary-700 to-secondary-900 bg-clip-text text-transparent">
                Hedefly
              </h1>
              <p className="text-2xl lg:text-3xl text-secondary-700 mb-6 max-w-4xl mx-auto font-medium">
                Modern Öğrenci Koçluğu Platformu
              </p>
              <p className="text-lg text-secondary-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Öğrenci yönetiminden detaylı analizlere, ödev sisteminden veli iletişimine kadar 
                öğrenci koçluğunun her aşamasını dijitalleştiren kapsamlı bir platform.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/giris" className="btn-primary text-lg px-10 py-4 inline-flex items-center justify-center group hover:scale-105 transition-all duration-300">
                Hemen Başla
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link href="/iletisim" className="btn-outline text-lg px-10 py-4 hover:scale-105 transition-all duration-300">
                İletişime Geç
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Free Teacher Slots Progress Section */}
      <FreeTeacherProgressSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* Core Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 mb-4">Platform Özellikleri</h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Öğrenci koçluğunun her aşamasını kapsayan güçlü araçlar
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Öğrenci Yönetimi */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl border border-blue-200 hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">Öğrenci Yönetimi</h3>
              <p className="text-secondary-600 mb-6">
                Öğrencilerinizi kolayca ekleyin, sınıflara atayın ve detaylı bilgilerini takip edin.
              </p>
              <ul className="space-y-2 text-sm text-secondary-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Sınıf bazlı öğrenci grupları
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Detaylı öğrenci profilleri
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Performans takibi
                </li>
              </ul>
            </div>

            {/* Ödev Sistemi */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl border border-green-200 hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">Gelişmiş Ödev Sistemi</h3>
              <p className="text-secondary-600 mb-6">
                Ödev verin, değerlendirin ve öğrenci ilerlemesini takip edin.
              </p>
              <ul className="space-y-2 text-sm text-secondary-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Bireysel ve sınıf ödevleri
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Otomatik puanlama sistemi
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Detaylı geri bildirim
                </li>
              </ul>
            </div>

            {/* Analiz ve Raporlama */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl border border-purple-200 hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">Detaylı Analiz</h3>
              <p className="text-secondary-600 mb-6">
                Kapsamlı raporlar ve analizlerle öğrenci performansını değerlendirin.
              </p>
              <ul className="space-y-2 text-sm text-secondary-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Performans grafikleri
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  PDF rapor oluşturma
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Trend analizi
                </li>
              </ul>
            </div>

            {/* Hedef Belirleme */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl border border-orange-200 hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-8 h-8 text-white" />
          </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">Hedef Belirleme</h3>
              <p className="text-secondary-600 mb-6">
                Öğrencilerle birlikte hedefler belirleyin ve ilerlemelerini takip edin.
              </p>
              <ul className="space-y-2 text-sm text-secondary-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Kişiselleştirilmiş hedefler
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  İlerleme takibi
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Başarı kutlamaları
                </li>
              </ul>
            </div>

            {/* Video Koçluk */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-2xl border border-red-200 hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-red-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">Video Koçluk</h3>
              <p className="text-secondary-600 mb-6">
                Canlı video oturumları ile öğrencilerinize birebir koçluk yapın.
              </p>
              <ul className="space-y-2 text-sm text-secondary-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Canlı oturumlar
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Oturum kayıtları
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Takvim entegrasyonu
                </li>
              </ul>
            </div>

            {/* Veli Portalı */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-8 rounded-2xl border border-teal-200 hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-teal-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-4">Veli Portalı</h3>
              <p className="text-secondary-600 mb-6">
                Veliler çocuklarının performansını detaylı olarak takip edebilir.
              </p>
              <ul className="space-y-2 text-sm text-secondary-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Detaylı raporlar
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Bildirim sistemi
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Öğretmen iletişimi
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section id="roles" className="py-20 bg-gradient-to-br from-secondary-50 to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 mb-4">Kimler Kullanır?</h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Hedefly platformu farklı rollerdeki kullanıcılar için özelleştirilmiş deneyimler sunar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Öğretmen */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center text-secondary-900 mb-4">Öğretmenler</h3>
              <p className="text-secondary-600 text-center mb-6">
                Öğrenci yönetimi, ödev verme, analiz ve koçluk araçları
              </p>
              <ul className="space-y-2 text-sm text-secondary-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Öğrenci ekleme ve yönetimi
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Ödev sistemi
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Detaylı analiz ve raporlama
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Video koçluk
                </li>
              </ul>
            </div>

            {/* Öğrenci */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center text-secondary-900 mb-4">Öğrenciler</h3>
              <p className="text-secondary-600 text-center mb-6">
                Ödevler, hedefler, planlar ve kişisel analiz araçları
              </p>
              <ul className="space-y-2 text-sm text-secondary-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Ödev takibi
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Hedef belirleme
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Plan oluşturma
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Performans analizi
                </li>
              </ul>
            </div>

            {/* Veli */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center text-secondary-900 mb-4">Veliler</h3>
              <p className="text-secondary-600 text-center mb-6">
                Çocuklarının eğitim sürecini takip etme ve iletişim
              </p>
              <ul className="space-y-2 text-sm text-secondary-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Detaylı raporlar
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Bildirim sistemi
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Öğretmen iletişimi
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Performans takibi
                </li>
              </ul>
            </div>

            {/* Admin */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center text-secondary-900 mb-4">Yöneticiler</h3>
              <p className="text-secondary-600 text-center mb-6">
                Sistem yönetimi, öğretmen onayları ve genel kontrol
              </p>
              <ul className="space-y-2 text-sm text-secondary-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Öğretmen onayları
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Sistem istatistikleri
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Kullanıcı yönetimi
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Platform kontrolü
                </li>
              </ul>
            </div>
          </div>
              </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary-900 mb-4">Neden Hedefly?</h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Modern eğitim teknolojileri ile öğrenci koçluğunu bir üst seviyeye taşıyın
              </p>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-secondary-900 mb-6">Kapsamlı Çözüm</h3>
              <p className="text-lg text-secondary-600 mb-8">
                Hedefly, öğrenci koçluğunun her aşamasını kapsayan tek platform. 
                Öğrenci yönetiminden detaylı analizlere, ödev sisteminden veli iletişimine 
                kadar her şeyi tek yerden yönetin.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1">Kolay Kullanım</h4>
                    <p className="text-secondary-600">Sezgisel arayüz ile hızlı öğrenme</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1">Güvenli Platform</h4>
                    <p className="text-secondary-600">Veri güvenliği ve gizlilik öncelikli</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1">Detaylı Raporlama</h4>
                    <p className="text-secondary-600">Kapsamlı analiz ve PDF raporlar</p>
                  </div>
            </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 p-8 rounded-2xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-secondary-900 mb-2">Performans Artışı</h4>
                  <p className="text-sm text-secondary-600">Öğrenci başarısında ölçülebilir iyileşme</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-secondary-900 mb-2">Zaman Tasarrufu</h4>
                  <p className="text-sm text-secondary-600">Otomatik süreçlerle verimlilik</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-secondary-900 mb-2">İletişim</h4>
                  <p className="text-sm text-secondary-600">Tüm taraflar arası şeffaf iletişim</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-secondary-900 mb-2">Kalite</h4>
                  <p className="text-sm text-secondary-600">Profesyonel eğitim standartları</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Hemen Başlayın
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
            Öğrenci koçluğunuzu dijitalleştirin ve daha etkili sonuçlar alın. 
            Ücretsiz deneme ile platformu keşfedin.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/giris" className="bg-white text-primary-600 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-primary-50 transition-colors duration-300 inline-flex items-center justify-center group">
              Ücretsiz Başla
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link href="/iletisim" className="border-2 border-white text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-primary-600 transition-colors duration-300">
              Demo Talep Et
            </Link>
          </div>
          <div className="mt-8 flex justify-center space-x-8 text-primary-100">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>Ücretsiz</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>Hızlı Kurulum</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>Güvenli</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}