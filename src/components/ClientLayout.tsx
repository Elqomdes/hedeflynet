'use client';

import { usePathname } from 'next/navigation';
import { useMemo, memo } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { ErrorBoundary } from './ErrorBoundary';

interface ClientLayoutProps {
  children: React.ReactNode;
}

function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  
  // Dashboard sayfalarında navbar ve footer'ı gizle
  const isDashboardPage = useMemo(() => pathname && (
    pathname.startsWith('/admin') || 
    pathname.startsWith('/ogrenci') || 
    pathname.startsWith('/ogretmen') ||
    pathname.startsWith('/veli')
  ), [pathname]);

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

export default memo(ClientLayout);
