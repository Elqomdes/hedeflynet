'use client';

import { useEffect } from 'react';
import { useCacheBuster } from '@/hooks/useCacheBuster';

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

  useEffect(() => {
    // Development modunda daha sık cache busting
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        bustCache();
      }, 2 * 60 * 1000); // 2 dakikada bir

      return () => clearInterval(interval);
    }
  }, [bustCache]);

  return <>{children}</>;
}
