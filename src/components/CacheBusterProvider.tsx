'use client';

import { useEffect } from 'react';
import { useCacheBuster } from '@/hooks/useCacheBuster';
import { useAutoCacheBust } from '@/hooks/useAutoCacheBust';

interface CacheBusterProviderProps {
  children: React.ReactNode;
}

export function CacheBusterProvider({ children }: CacheBusterProviderProps) {
  const { bustCache } = useCacheBuster({
    autoBust: true,
    intervalMs: 5 * 60 * 1000, // 5 dakikada bir
    onPageChange: true,
    onVisibilityChange: true,
  });

  // Otomatik cache busting
  const { checkForUpdates, manualBust } = useAutoCacheBust({
    intervalMs: 2 * 60 * 1000, // 2 dakikada bir
    checkOnFocus: true,
    checkOnVisibilityChange: true,
    forceReloadOnUpdate: true
  });

  useEffect(() => {
    // Development modunda daha sık cache busting
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        bustCache();
        checkForUpdates();
      }, 1 * 60 * 1000); // 1 dakikada bir

      return () => clearInterval(interval);
    }
  }, [bustCache, checkForUpdates]);

  // Sayfa yüklendiğinde cache kontrolü
  useEffect(() => {
    // İlk yüklemede cache kontrolü
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 5000); // 5 saniye sonra

    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  return <>{children}</>;
}
