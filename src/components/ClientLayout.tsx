'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import { ErrorBoundary } from './ErrorBoundary';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  
  // Dashboard sayfalarında navbar ve footer'ı gizle
  const isDashboardPage = pathname && (
    pathname.startsWith('/admin') || 
    pathname.startsWith('/ogrenci') || 
    pathname.startsWith('/ogretmen') ||
    pathname.startsWith('/veli')
  );

  return (
    <ErrorBoundary>
      {!isDashboardPage && <Navbar />}
      <main className={isDashboardPage ? "" : "min-h-screen"}>
        {children}
      </main>
      {!isDashboardPage && <Footer />}
    </ErrorBoundary>
  );
}
