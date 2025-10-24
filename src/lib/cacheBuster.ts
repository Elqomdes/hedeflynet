/**
 * Cache Busting Utility
 * Sitede değişiklik olduğunda otomatik olarak cache'i temizler
 */

class CacheBuster {
  private static instance: CacheBuster;
  private version: string;
  private lastUpdate: number;

  constructor() {
    this.version = this.generateVersion();
    this.lastUpdate = Date.now();
  }

  static getInstance(): CacheBuster {
    if (!CacheBuster.instance) {
      CacheBuster.instance = new CacheBuster();
    }
    return CacheBuster.instance;
  }

  private generateVersion(): string {
    // Timestamp + random string + build hash
    const buildHash = process.env.NEXT_PUBLIC_BUILD_HASH || 'dev';
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${buildHash}`;
  }

  /**
   * Cache'i temizler ve yeni version oluşturur
   */
  bustCache(): void {
    this.version = this.generateVersion();
    this.lastUpdate = Date.now();
    
    // Browser cache'i temizle
    if (typeof window !== 'undefined') {
      // Service Worker cache'i temizle
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister();
          });
        });
      }

      // Local storage'daki cache'i temizle
      this.clearLocalCache();
      
      // Memory cache'i temizle
      this.clearMemoryCache();

      // Session storage'ı temizle
      this.clearSessionCache();

      // IndexedDB cache'i temizle
      this.clearIndexedDBCache();

      // Browser cache'i zorla temizle
      this.clearBrowserCache();

      // Force reload if needed
      this.forceReloadIfNeeded();
    }
  }

  /**
   * Local storage'daki cache'i temizler
   */
  private clearLocalCache(): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('cache_') || key.startsWith('api_') || key.startsWith('data_'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Memory cache'i temizler
   */
  private clearMemoryCache(): void {
    // Global cache objelerini temizle
    if (typeof window !== 'undefined') {
      (window as any).__CACHE__ = {};
      (window as any).__API_CACHE__ = {};
    }
  }

  /**
   * Session storage'ı temizler
   */
  private clearSessionCache(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('cache') || key.includes('version') || key.includes('bust'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    }
  }

  /**
   * IndexedDB cache'i temizler
   */
  private clearIndexedDBCache(): void {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      // IndexedDB'deki cache veritabanlarını temizle
      const dbNames = ['cache', 'version', 'bust'];
      dbNames.forEach(dbName => {
        try {
          indexedDB.deleteDatabase(dbName);
        } catch (error) {
          console.warn(`Failed to delete IndexedDB database: ${dbName}`, error);
        }
      });
    }
  }

  /**
   * Browser cache'i zorla temizler
   */
  private clearBrowserCache(): void {
    if (typeof window !== 'undefined') {
      // Cache API'sini temizle
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
          });
        });
      }

      // HTTP cache'i bypass etmek için timestamp ekle
      const timestamp = Date.now();
      const links = document.querySelectorAll('link[rel="stylesheet"], script[src]');
      
      links.forEach((element: any) => {
        if (element.href || element.src) {
          const url = new URL(element.href || element.src);
          url.searchParams.set('_cb', timestamp.toString());
          element.href = url.toString();
        }
      });

      // Image cache'i temizle
      const images = document.querySelectorAll('img[src]');
      images.forEach((img: any) => {
        if (img.src) {
          const url = new URL(img.src);
          url.searchParams.set('_cb', timestamp.toString());
          img.src = url.toString();
        }
      });
    }
  }

  /**
   * Gerekirse sayfayı zorla yeniler
   */
  private forceReloadIfNeeded(): void {
    if (typeof window !== 'undefined') {
      // Kritik güncellemeler için sayfayı yenile
      const lastReload = localStorage.getItem('lastCacheBust');
      const now = Date.now();
      
      // Development modunda daha sık yenile
      const reloadInterval = process.env.NODE_ENV === 'development' ? 2 * 60 * 1000 : 5 * 60 * 1000;
      
      if (!lastReload || (now - parseInt(lastReload)) > reloadInterval) {
        localStorage.setItem('lastCacheBust', now.toString());
        
        // Sayfayı yenile
        setTimeout(() => {
          window.location.reload(); // Hard reload
        }, 100);
      }
    }
  }

  /**
   * Cache busting parametresi döndürür
   */
  getCacheBuster(): string {
    return `v=${this.version}&t=${this.lastUpdate}`;
  }

  /**
   * URL'e cache busting parametresi ekler
   */
  addCacheBuster(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${this.getCacheBuster()}`;
  }

  /**
   * API istekleri için cache busting header'ları döndürür
   */
  getCacheBustingHeaders(): Record<string, string> {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Cache-Buster': this.getCacheBuster(),
      'X-Request-Time': this.lastUpdate.toString(),
    };
  }

  /**
   * Otomatik cache busting başlatır
   */
  startAutoBusting(intervalMs: number = 5 * 60 * 1000): void {
    setInterval(() => {
      this.bustCache();
    }, intervalMs);
  }

  /**
   * Sayfa değişikliklerini dinler ve cache'i otomatik temizler
   */
  startPageChangeListener(): void {
    if (typeof window === 'undefined') return;

    let lastPathname = window.location.pathname;
    
    const checkForChanges = () => {
      if (window.location.pathname !== lastPathname) {
        lastPathname = window.location.pathname;
        this.bustCache();
      }
    };

    // Popstate event (back/forward navigation)
    window.addEventListener('popstate', checkForChanges);
    
    // Hash change event
    window.addEventListener('hashchange', checkForChanges);
    
    // Custom event for programmatic navigation
    window.addEventListener('beforeunload', () => {
      this.bustCache();
    });
  }
}

export const cacheBuster = CacheBuster.getInstance();

// Development modunda otomatik cache busting
if (process.env.NODE_ENV === 'development') {
  cacheBuster.startAutoBusting(1 * 60 * 1000); // 1 dakikada bir
  cacheBuster.startPageChangeListener();
}

// Production modunda da otomatik cache busting
if (process.env.NODE_ENV === 'production') {
  cacheBuster.startAutoBusting(5 * 60 * 1000); // 5 dakikada bir
  cacheBuster.startPageChangeListener();
}
