'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

export default function ParentRegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    setError('');

    // Input validation
    if (!formData.username || formData.username.trim().length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır');
      setIsLoading(false);
      return;
    }

    if (!formData.firstName || formData.firstName.trim().length < 2) {
      setError('Ad en az 2 karakter olmalıdır');
      setIsLoading(false);
      return;
    }

    if (!formData.lastName || formData.lastName.trim().length < 2) {
      setError('Soyad en az 2 karakter olmalıdır');
      setIsLoading(false);
      return;
    }

    if (!formData.email || !formData.email.includes('@')) {
      setError('Geçerli bir e-posta adresi giriniz');
      setIsLoading(false);
      return;
    }

    if (!formData.phone || formData.phone.length < 10) {
      setError('Telefon numarası en az 10 karakter olmalıdır');
      setIsLoading(false);
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/parent/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          children: []
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear form data
        setFormData({
          username: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: ''
        });
        setIsLoading(false);
        
        // Redirect to login page with success message
        router.push('/giris?message=Kayıt başarılı! Giriş yapabilirsiniz.');
      } else {
        setError(data.error || 'Kayıt oluşturulamadı');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Sunucu hatası oluştu');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-primary-100/20"></div>
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
            <span className="text-white font-bold text-2xl">H</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-2">
            Hedefly
          </h1>
          <h2 className="text-3xl font-bold text-secondary-900 mb-4">
            Veli Kayıt
          </h2>
          <p className="text-secondary-600">
            Veli hesabı oluşturun ve çocuğunuzun eğitim sürecini takip edin
          </p>
        </div>

        <div className="card animate-slide-up">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-secondary-700 mb-3">
                Kullanıcı Adı
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="input-field"
                placeholder="Kullanıcı adınız"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-secondary-700 mb-3">
                  Ad
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Adınız"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-secondary-700 mb-3">
                  Soyad
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Soyadınız"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-secondary-700 mb-3">
                E-posta
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="E-posta adresiniz"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-secondary-700 mb-3">
                Telefon
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="Telefon numaranız"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-secondary-700 mb-3">
                Şifre
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pr-12"
                  placeholder="Şifreniz"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-secondary-50 rounded-r-xl transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-secondary-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-secondary-500" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-secondary-700 mb-3">
                Şifre Tekrar
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field pr-12"
                  placeholder="Şifrenizi tekrar girin"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-secondary-50 rounded-r-xl transition-colors duration-200"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-secondary-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-secondary-500" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center space-x-3 py-4 text-lg"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner w-5 h-5" />
                  <span>Kayıt oluşturuluyor...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Kayıt Ol</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-secondary-600">
              Zaten hesabınız var mı?{' '}
              <Link href="/giris" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200">
                Giriş yapın
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
