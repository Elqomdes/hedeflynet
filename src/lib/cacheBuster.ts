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
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
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
  cacheBuster.startAutoBusting(2 * 60 * 1000); // 2 dakikada bir
  cacheBuster.startPageChangeListener();
}
