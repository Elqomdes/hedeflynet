import Link from 'next/link';
import { Mail, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-secondary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Hedefly</h3>
            <p className="text-secondary-300 mb-4">
              Eduly Eğitim Teknolojileri altında modern öğrenci koçluk platformu.
            </p>
            <div className="flex items-center space-x-2 text-secondary-300">
              <Globe className="w-4 h-4" />
              <a 
                href="https://edulyedu.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                edulyedu.com
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Hızlı Linkler</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-secondary-300 hover:text-white transition-colors">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link href="/iletisim" className="text-secondary-300 hover:text-white transition-colors">
                  İletişim
                </Link>
              </li>
              <li>
                <Link href="/giris" className="text-secondary-300 hover:text-white transition-colors">
                  Giriş Yap
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">İletişim</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-secondary-300">
                <Mail className="w-4 h-4" />
                <a 
                  href="mailto:iletisim@edulyedu.com"
                  className="hover:text-white transition-colors"
                >
                  iletisim@edulyedu.com
                </a>
              </div>
              <p className="text-secondary-300">
                Domain: hedefly.net
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-secondary-700 mt-8 pt-8 text-center text-secondary-300">
          <p>&copy; 2024 Hedefly - Eduly Eğitim Teknolojileri. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
