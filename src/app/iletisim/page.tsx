'use client';

import { useState, useEffect } from 'react';
import { Send, Mail, Phone, MapPin } from 'lucide-react';
import emailjs from '@emailjs/browser';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    experience: '',
    subjects: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // EmailJS configuration
  const EMAILJS_SERVICE_ID = 'service_iqwh4mo';
  const EMAILJS_TEMPLATE_ID = 'template_ypcggf8';
  const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'quNu5gUgfBaEvzkq9';

  useEffect(() => {
    // EmailJS'i initialize et - sadece public key varsa
    if (EMAILJS_PUBLIC_KEY) {
      emailjs.init(EMAILJS_PUBLIC_KEY);
    }
  }, [EMAILJS_PUBLIC_KEY]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // EmailJS konfigürasyonu kontrolü
    if (!EMAILJS_PUBLIC_KEY) {
      console.error('EmailJS Public Key not configured');
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      // EmailJS ile email gönder
      const templateParams = {
        from_name: `${formData.firstName} ${formData.lastName}`,
        from_email: formData.email,
        phone: formData.phone,
        experience: formData.experience,
        subjects: formData.subjects,
        message: formData.message,
        to_name: 'Hedefly Ekibi'
      };

      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      if (result.status === 200) {
        setSubmitStatus('success');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          experience: '',
          subjects: '',
          message: ''
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('EmailJS error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-secondary-900 mb-4">
            Öğretmen Başvurusu
          </h1>
          <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
            Hedefly platformunda öğretmen olmak için başvuru formunu doldurun
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="card">
            <h2 className="text-2xl font-semibold text-secondary-900 mb-6">
              Başvuru Formu
            </h2>
            
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                Başvurunuz başarıyla email olarak gönderildi! En kısa sürede sizinle iletişime geçeceğiz.
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                Email gönderilirken bir hata oluştu. Lütfen tekrar deneyin veya doğrudan iletisim@edulyedu.com adresine yazın.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-secondary-700 mb-2">
                    Ad *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Adınız"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-secondary-700 mb-2">
                    Soyad *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Soyadınız"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                  E-posta *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="ornek@email.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 mb-2">
                  Telefon *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="0555 123 45 67"
                />
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-secondary-700 mb-2">
                  Deneyim *
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  required
                  rows={3}
                  value={formData.experience}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Eğitim deneyiminizi kısaca açıklayın"
                />
              </div>

              <div>
                <label htmlFor="subjects" className="block text-sm font-medium text-secondary-700 mb-2">
                  Branşlar *
                </label>
                <input
                  type="text"
                  id="subjects"
                  name="subjects"
                  required
                  value={formData.subjects}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Matematik, Fizik, Kimya (virgülle ayırın)"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-secondary-700 mb-2">
                  Mesaj
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Eklemek istediğiniz bilgiler"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Başvuru Gönder</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div className="card">
              <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                İletişim Bilgileri
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-primary-600" />
                  <a 
                    href="mailto:iletisim@edulyedu.com"
                    className="text-secondary-700 hover:text-primary-600 transition-colors"
                  >
                    iletisim@edulyedu.com
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  <span className="text-secondary-700">
                    Domain: hedefly.net
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-primary-600" />
                  <span className="text-secondary-700">
                    Ana Site: edulyedu.com
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                Başvuru Süreci
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-600 text-sm font-semibold">1</span>
                  </div>
                  <p className="text-secondary-700">
                    Başvuru formunu doldurun
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-600 text-sm font-semibold">2</span>
                  </div>
                  <p className="text-secondary-700">
                    Başvurunuzu değerlendiriyoruz
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-600 text-sm font-semibold">3</span>
                  </div>
                  <p className="text-secondary-700">
                    Onaylandığında hesabınız oluşturulur
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
