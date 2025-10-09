/**
 * Cache Busting Hook
 * Sitede değişiklik olduğunda otomatik olarak cache'i temizler
 */

import { useEffect, useCallback } from 'react';
import { cacheBuster } from '@/lib/cacheBuster';

interface UseCacheBusterOptions {
  autoBust?: boolean;
  intervalMs?: number;
  onPageChange?: boolean;
  onVisibilityChange?: boolean;
}

export function useCacheBuster(options: UseCacheBusterOptions = {}) {
  const {
    autoBust = true,
    intervalMs = 5 * 60 * 1000, // 5 dakika
    onPageChange = true,
    onVisibilityChange = true,
  } = options;

  const bustCache = useCallback(() => {
    cacheBuster.bustCache();
  }, []);

  const bustCacheForUrl = useCallback((url: string) => {
    return cacheBuster.addCacheBuster(url);
  }, []);

  const getCacheBustingHeaders = useCallback(() => {
    return cacheBuster.getCacheBustingHeaders();
  }, []);

  useEffect(() => {
    if (!autoBust) return;

    // Otomatik cache busting
    const interval = setInterval(() => {
      bustCache();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [autoBust, intervalMs, bustCache]);

  useEffect(() => {
    if (!onPageChange) return;

    // Sayfa değişikliklerini dinle
    cacheBuster.startPageChangeListener();

    // Custom event listener for programmatic navigation
    const handleNavigation = () => {
      bustCache();
    };

    window.addEventListener('beforeunload', handleNavigation);
    
    return () => {
      window.removeEventListener('beforeunload', handleNavigation);
    };
  }, [onPageChange, bustCache]);

  useEffect(() => {
    if (!onVisibilityChange) return;

    // Sayfa görünürlük değişikliklerini dinle
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Sayfa tekrar görünür olduğunda cache'i temizle
        bustCache();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onVisibilityChange, bustCache]);

  return {
    bustCache,
    bustCacheForUrl,
    getCacheBustingHeaders,
  };
}
