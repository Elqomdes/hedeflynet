// Performance monitoring utilities
interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage?: number;
  networkType?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if (typeof window === 'undefined') return;

    // Monitor page load performance
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric({
              pageLoadTime: navEntry.loadEventEnd - navEntry.fetchStart,
              apiResponseTime: 0,
              renderTime: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            });
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    }

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric({
          pageLoadTime: 0,
          apiResponseTime: 0,
          renderTime: 0,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
        });
      }, 30000); // Every 30 seconds
    }

    // Monitor network information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.recordMetric({
        pageLoadTime: 0,
        apiResponseTime: 0,
        renderTime: 0,
        networkType: connection.effectiveType,
      });
    }
  }

  recordMetric(metric: Partial<PerformanceMetrics>) {
    const fullMetric: PerformanceMetrics = {
      pageLoadTime: 0,
      apiResponseTime: 0,
      renderTime: 0,
      ...metric,
    };

    this.metrics.push(fullMetric);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log slow operations
    if (fullMetric.pageLoadTime > 3000) {
      console.warn('Slow page load detected:', fullMetric.pageLoadTime + 'ms');
    }

    if (fullMetric.apiResponseTime > 2000) {
      console.warn('Slow API response detected:', fullMetric.apiResponseTime + 'ms');
    }
  }

  measureApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    return apiCall().then((result) => {
      const endTime = performance.now();
      this.recordMetric({
        apiResponseTime: endTime - startTime,
      });
      return result;
    }).catch((error) => {
      const endTime = performance.now();
      this.recordMetric({
        apiResponseTime: endTime - startTime,
      });
      throw error;
    });
  }

  measureRender<T>(renderFunction: () => T): T {
    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();
    
    this.recordMetric({
      renderTime: endTime - startTime,
    });
    
    return result;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {};

    const totals = this.metrics.reduce((acc, metric) => ({
      pageLoadTime: acc.pageLoadTime + metric.pageLoadTime,
      apiResponseTime: acc.apiResponseTime + metric.apiResponseTime,
      renderTime: acc.renderTime + metric.renderTime,
      memoryUsage: (acc.memoryUsage || 0) + (metric.memoryUsage || 0),
    }), { pageLoadTime: 0, apiResponseTime: 0, renderTime: 0, memoryUsage: 0 });

    const count = this.metrics.length;
    
    return {
      pageLoadTime: totals.pageLoadTime / count,
      apiResponseTime: totals.apiResponseTime / count,
      renderTime: totals.renderTime / count,
      memoryUsage: (totals.memoryUsage || 0) / count,
    };
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions
export function measureApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
  return performanceMonitor.measureApiCall(apiCall);
}

export function measureRender<T>(renderFunction: () => T): T {
  return performanceMonitor.measureRender(renderFunction);
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const recordMetric = (metric: Partial<PerformanceMetrics>) => {
    performanceMonitor.recordMetric(metric);
  };

  const getMetrics = () => {
    return performanceMonitor.getMetrics();
  };

  const getAverageMetrics = () => {
    return performanceMonitor.getAverageMetrics();
  };

  return {
    recordMetric,
    getMetrics,
    getAverageMetrics,
  };
}
