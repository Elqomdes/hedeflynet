import { useEffect, useCallback, useState } from 'react';
import { cacheBuster } from '@/lib/cacheBuster';

interface UseAutoCacheBustOptions {
  intervalMs?: number;
  checkOnFocus?: boolean;
  checkOnVisibilityChange?: boolean;
  forceReloadOnUpdate?: boolean;
}

export function useAutoCacheBust(options: UseAutoCacheBustOptions = {}) {
  const {
    intervalMs = 2 * 60 * 1000, // 2 dakika
    checkOnFocus = true,
    checkOnVisibilityChange = true,
    forceReloadOnUpdate = true
  } = options;

  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<number>(0);

  const checkForUpdates = useCallback(async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    
    try {
      // API'den version bilgisini al
      const response = await fetch('/api/cache-bust', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const currentVersion = localStorage.getItem('app-version');
        
        if (!currentVersion || currentVersion !== data.version) {
          console.log('Yeni sürüm tespit edildi, cache temizleniyor...');
          
          // Cache'i temizle
          cacheBuster.bustCache();
          
          // Yeni version'ı kaydet
          localStorage.setItem('app-version', data.version);
          
          if (forceReloadOnUpdate) {
            // Sayfayı yenile
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }
        
        setLastCheck(Date.now());
      }
    } catch (error) {
      console.error('Cache update check failed:', error);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, forceReloadOnUpdate]);

  // Periyodik kontrol
  useEffect(() => {
    const interval = setInterval(checkForUpdates, intervalMs);
    return () => clearInterval(interval);
  }, [checkForUpdates, intervalMs]);

  // Sayfa odaklandığında kontrol
  useEffect(() => {
    if (!checkOnFocus) return;

    const handleFocus = () => {
      // Son kontrolden 30 saniye geçmişse tekrar kontrol et
      if (Date.now() - lastCheck > 30000) {
        checkForUpdates();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkOnFocus, checkForUpdates, lastCheck]);

  // Sayfa görünürlük değişikliğinde kontrol
  useEffect(() => {
    if (!checkOnVisibilityChange) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Son kontrolden 1 dakika geçmişse tekrar kontrol et
        if (Date.now() - lastCheck > 60000) {
          checkForUpdates();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkOnVisibilityChange, checkForUpdates, lastCheck]);

  // Manuel cache busting
  const manualBust = useCallback(async () => {
    try {
      const response = await fetch('/api/cache-bust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'bust' })
      });
      
      if (response.ok) {
        const data = await response.json();
        cacheBuster.bustCache();
        localStorage.setItem('app-version', data.version);
        
        if (forceReloadOnUpdate) {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Manual cache bust failed:', error);
    }
  }, [forceReloadOnUpdate]);

  return {
    checkForUpdates,
    manualBust,
    isChecking,
    lastCheck
  };
}
