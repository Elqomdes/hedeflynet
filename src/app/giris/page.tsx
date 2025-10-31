'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter();

  // Check for success message in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    if (message) {
      setSuccessMessage(message);
    }
  }, []);

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
    if (!formData.username || formData.username.trim().length === 0) {
      setError('Kullanıcı adı veya e-posta gereklidir');
      setIsLoading(false);
      return;
    }

    if (formData.username.trim().length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır');
      setIsLoading(false);
      return;
    }

    if (!formData.password || formData.password.length === 0) {
      setError('Şifre gereklidir');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear form data
        setFormData({ username: '', password: '' });
        setIsLoading(false);
        
        // Redirect based on user role
        if (data.user.role === 'parent') {
          router.push('/veli');
        } else if (data.user.role === 'student') {
          router.push('/ogrenci');
        } else if (data.user.role === 'teacher') {
          router.push('/ogretmen');
        } else if (data.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        setError(data.error || 'Giriş yapılamadı');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Sunucu hatası oluştu');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-primary-100/20"></div>
      <div className="max-w-md w-full space-y-6 sm:space-y-8 relative z-10">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-glow">
            <span className="text-white font-bold text-xl sm:text-2xl">H</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-2">
            Hedefly
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-secondary-900 mb-3 sm:mb-4">
            Giriş Yap
          </h2>
          <p className="text-sm sm:text-base text-secondary-600">
            Hesabınıza giriş yaparak devam edin
          </p>
        </div>

        <div className="card animate-slide-up">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {successMessage && (
              <div className="alert alert-success">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-secondary-700 mb-3">
                Kullanıcı Adı veya E-posta
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="input-field"
                placeholder="Kullanıcı adınız veya e-posta adresiniz"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center space-x-3 py-3 sm:py-4 text-base sm:text-lg min-h-[48px] touch-manipulation"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner w-5 h-5" />
                  <span>Giriş yapılıyor...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Giriş Yap</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-secondary-600">
              Öğretmen olmak için{' '}
              <Link href="/iletisim" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200">
                başvuru yapın
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
