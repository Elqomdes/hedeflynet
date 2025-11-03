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
  role: 'admin' | 'teacher' | 'student';
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

// Enhanced Free Teacher Progress Section Component - Now Hero
function EnhancedFreeTeacherProgressSection() {
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
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center">
          <div className="animate-pulse">
            <div className="h-12 bg-white/30 rounded w-96 mx-auto mb-6"></div>
            <div className="h-6 bg-white/20 rounded w-64 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  // Hide the promo section automatically when slots are full (>= total)
  if (slotData && slotData.usedSlots >= slotData.totalSlots) {
    return null;
  }

  const progressPercentage = (slotData.usedSlots / slotData.totalSlots) * 100;

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-white/15 rounded-full animate-bounce"></div>
        <div className="absolute bottom-32 left-1/4 w-16 h-16 bg-white/20 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Logo and Brand */}
        <div className="mb-8 sm:mb-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-sm rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl border border-white/30">
            <span className="text-white font-bold text-2xl sm:text-3xl lg:text-4xl">H</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-4 sm:mb-6 drop-shadow-2xl">
            Hedefly
          </h1>
        </div>

        {/* Main Offer */}
        <div className="mb-12 sm:mb-16">
          <div className="inline-flex items-center justify-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6 sm:mb-8 shadow-2xl animate-pulse">
            <Gift className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white mr-2 sm:mr-3" />
            <span className="text-white font-bold text-sm sm:text-lg lg:text-2xl">İLK 20 ÖĞRETMEN ÜCRETSİZ!</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-6 sm:mb-8 drop-shadow-xl px-4">
            Modern Öğrenci Koçluğu Platformu
          </h2>
          
          <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-white/90 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-lg px-4">
            Platformumuzun açılışında ilk 50 öğretmenimize 1 yıl boyunca ücretsiz erişim imkanı sunuyoruz.
            <br className="hidden sm:block" />
            <span className="block sm:inline font-bold text-yellow-300 mt-2 sm:mt-0">Hemen başvurun ve bu fırsattan yararlanın!</span>
          </p>
        </div>

        {/* Progress Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12 border border-white/20 shadow-2xl mx-2 sm:mx-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* Progress Bar */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">İlerleme Durumu</h3>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-300">
                  {slotData.usedSlots}/{slotData.totalSlots}
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-6 sm:h-8 mb-4 sm:mb-6">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-6 sm:h-8 rounded-full transition-all duration-2000 ease-out shadow-lg"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between text-sm sm:text-base lg:text-lg text-white/80 gap-2">
                <span>Kullanılan: {slotData.usedSlots}</span>
                <span>Kalan: {slotData.availableSlots}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              <div className="text-center p-4 sm:p-6 lg:p-8 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-yellow-300 mb-2 sm:mb-3">{slotData.usedSlots}</div>
                <div className="text-sm sm:text-base lg:text-lg text-white/80">Kullanılan Slot</div>
              </div>
              <div className="text-center p-4 sm:p-6 lg:p-8 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-300 mb-2 sm:mb-3">{slotData.availableSlots}</div>
                <div className="text-sm sm:text-base lg:text-lg text-white/80">Kalan Slot</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Assignments */}
        {slotData.recentAssignments.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12 border border-white/20 shadow-2xl mx-2 sm:mx-0">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-6 sm:mb-8 text-center">
              Son Atanan Öğretmenler
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {slotData.recentAssignments.map((assignment, index) => (
                <div key={index} className="flex items-center p-4 sm:p-6 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mr-3 sm:mr-4 shadow-lg flex-shrink-0">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-base sm:text-lg truncate">{assignment.teacherName}</div>
                    <div className="text-white/70 text-sm sm:text-base">Slot #{assignment.slotNumber}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
          <Link 
            href="/giris" 
            className="inline-flex items-center justify-center px-6 sm:px-8 lg:px-12 py-4 sm:py-5 lg:py-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-base sm:text-lg lg:text-xl rounded-xl sm:rounded-2xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 min-h-[48px] touch-manipulation"
          >
            <Gift className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
            <span className="text-center">ÜCRETSİZ BAŞVURU YAP</span>
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3" />
          </Link>
          <Link 
            href="/iletisim" 
            className="inline-flex items-center justify-center px-6 sm:px-8 lg:px-12 py-4 sm:py-5 lg:py-6 bg-white/20 backdrop-blur-sm text-white font-bold text-base sm:text-lg lg:text-xl rounded-xl sm:rounded-2xl hover:bg-white/30 transition-all duration-300 border border-white/30 shadow-xl min-h-[48px] touch-manipulation"
          >
            İletişime Geç
          </Link>
        </div>

        {/* Urgency Message */}
        <div className="mt-8 sm:mt-12 text-center px-4">
          <p className="text-white/80 text-sm sm:text-base lg:text-lg">
            ⚡ <span className="font-bold text-yellow-300">Sınırlı Sayıda!</span> Sadece {slotData.availableSlots} slot kaldı!
          </p>
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
          <div className="mb-12 flex justify-center">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-6 text-white text-center shadow-xl max-w-4xl w-full">
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
                href="/iletisim" 
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
    <div className="min-h-screen bg-secondary-50">

      {/* Enhanced Free Teacher Slots Progress Section - Now Hero */}
      <EnhancedFreeTeacherProgressSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* Core Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary-900 mb-3 sm:mb-4">Platform Özellikleri</h2>
            <p className="text-base sm:text-lg lg:text-xl text-secondary-600 max-w-3xl mx-auto px-4">
              Öğrenci koçluğunun her aşamasını kapsayan güçlü araçlar
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Öğrenci Yönetimi */}
            <div className="card card-hover group animate-scale-in">
              <div className="card-header">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="card-title text-lg sm:text-xl">Öğrenci Yönetimi</h3>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-secondary-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Öğrencilerinizi kolayca ekleyin, sınıflara atayın ve detaylı bilgilerini takip edin.
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-secondary-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Sınıf bazlı öğrenci grupları
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Detaylı öğrenci profilleri
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Performans takibi
                  </li>
                </ul>
              </div>
            </div>

            {/* Ödev Sistemi */}
            <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.1s'}}>
              <div className="card-header">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="card-title text-lg sm:text-xl">Gelişmiş Ödev Sistemi</h3>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-secondary-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Ödev verin, değerlendirin ve öğrenci ilerlemesini takip edin.
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-secondary-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Bireysel ve sınıf ödevleri
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Otomatik puanlama sistemi
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Detaylı geri bildirim
                  </li>
                </ul>
              </div>
            </div>

            {/* Analiz ve Raporlama */}
            <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.2s'}}>
              <div className="card-header">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="card-title text-lg sm:text-xl">Detaylı Analiz</h3>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-secondary-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Kapsamlı raporlar ve analizlerle öğrenci performansını değerlendirin.
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-secondary-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Performans grafikleri
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    PDF rapor oluşturma
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Trend analizi
                  </li>
                </ul>
              </div>
            </div>

            {/* Hedef Belirleme */}
            <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.3s'}}>
              <div className="card-header">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Target className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="card-title text-lg sm:text-xl">Hedef Belirleme</h3>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-secondary-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Öğrencilerle birlikte hedefler belirleyin ve ilerlemelerini takip edin.
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-secondary-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Kişiselleştirilmiş hedefler
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    İlerleme takibi
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Başarı kutlamaları
                  </li>
                </ul>
              </div>
            </div>

            {/* Video Koçluk */}
            <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.4s'}}>
              <div className="card-header">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Video className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="card-title text-lg sm:text-xl">Video Koçluk</h3>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-secondary-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Canlı video oturumları ile öğrencilerinize birebir koçluk yapın.
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-secondary-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Canlı oturumlar
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Oturum kayıtları
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Takvim entegrasyonu
                  </li>
                </ul>
              </div>
            </div>

            {/* Veli Portalı */}
            <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.5s'}}>
              <div className="card-header">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <UserCheck className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="card-title text-lg sm:text-xl">Veli Portalı</h3>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-secondary-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Veliler çocuklarının performansını detaylı olarak takip edebilir.
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-secondary-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Detaylı raporlar
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Bildirim sistemi
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Öğretmen iletişimi
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section id="roles" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-secondary-50 to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary-900 mb-3 sm:mb-4">Kimler Kullanır?</h2>
            <p className="text-base sm:text-lg lg:text-xl text-secondary-600 max-w-3xl mx-auto px-4">
              Hedefly platformu farklı rollerdeki kullanıcılar için özelleştirilmiş deneyimler sunar
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Öğretmen */}
            <div className="card card-hover group animate-scale-in">
              <div className="card-header text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="card-title text-center text-lg sm:text-xl">Öğretmenler</h3>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-secondary-600 text-center mb-4 sm:mb-6 text-sm sm:text-base">
                  Öğrenci yönetimi, ödev verme, analiz ve koçluk araçları
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-secondary-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Öğrenci ekleme ve yönetimi
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Ödev sistemi
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Detaylı analiz ve raporlama
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Video koçluk
                  </li>
                </ul>
              </div>
            </div>

            {/* Öğrenci */}
            <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.1s'}}>
              <div className="card-header text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="card-title text-center text-lg sm:text-xl">Öğrenciler</h3>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-secondary-600 text-center mb-4 sm:mb-6 text-sm sm:text-base">
                  Ödevler, hedefler, planlar ve kişisel analiz araçları
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-secondary-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Ödev takibi
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Hedef belirleme
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Plan oluşturma
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Performans analizi
                  </li>
                </ul>
              </div>
            </div>

            {/* Veli */}
            <div className="card card-hover group animate-scale-in" style={{animationDelay: '0.2s'}}>
              <div className="card-header text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <UserCheck className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="card-title text-center text-lg sm:text-xl">Veliler</h3>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-secondary-600 text-center mb-4 sm:mb-6 text-sm sm:text-base">
                  Çocuklarının eğitim sürecini takip etme ve iletişim
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-secondary-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Detaylı raporlar
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Bildirim sistemi
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Öğretmen iletişimi
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    Performans takibi
                  </li>
                </ul>
              </div>
            </div>
          </div>
              </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary-900 mb-3 sm:mb-4">Neden Hedefly?</h2>
            <p className="text-base sm:text-lg lg:text-xl text-secondary-600 max-w-3xl mx-auto px-4">
              Modern eğitim teknolojileri ile öğrenci koçluğunu bir üst seviyeye taşıyın
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-secondary-900 mb-4 sm:mb-6">Kapsamlı Çözüm</h3>
              <p className="text-base sm:text-lg text-secondary-600 mb-6 sm:mb-8">
                Hedefly, öğrenci koçluğunun her aşamasını kapsayan tek platform. 
                Öğrenci yönetiminden detaylı analizlere, ödev sisteminden veli iletişimine 
                kadar her şeyi tek yerden yönetin.
              </p>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1 text-sm sm:text-base">Kolay Kullanım</h4>
                    <p className="text-secondary-600 text-xs sm:text-sm">Sezgisel arayüz ile hızlı öğrenme</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1 text-sm sm:text-base">Güvenli Platform</h4>
                    <p className="text-secondary-600 text-xs sm:text-sm">Veri güvenliği ve gizlilik öncelikli</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1 text-sm sm:text-base">Detaylı Raporlama</h4>
                    <p className="text-secondary-600 text-xs sm:text-sm">Kapsamlı analiz ve PDF raporlar</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                      <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                    </div>
                    <h4 className="font-bold text-secondary-900 mb-2 text-sm sm:text-base">Performans Artışı</h4>
                    <p className="text-xs sm:text-sm text-secondary-600">Öğrenci başarısında ölçülebilir iyileşme</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                      <Clock className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                    </div>
                    <h4 className="font-bold text-secondary-900 mb-2 text-sm sm:text-base">Zaman Tasarrufu</h4>
                    <p className="text-xs sm:text-sm text-secondary-600">Otomatik süreçlerle verimlilik</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                      <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                    </div>
                    <h4 className="font-bold text-secondary-900 mb-2 text-sm sm:text-base">İletişim</h4>
                    <p className="text-xs sm:text-sm text-secondary-600">Tüm taraflar arası şeffaf iletişim</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                      <Award className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                    </div>
                    <h4 className="font-bold text-secondary-900 mb-2 text-sm sm:text-base">Kalite</h4>
                    <p className="text-xs sm:text-sm text-secondary-600">Profesyonel eğitim standartları</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      

    </div>
  );
}