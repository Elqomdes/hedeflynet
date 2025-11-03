import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';

interface PrefetchOptions {
  enabled?: boolean;
  delay?: number;
}

export function usePrefetch() {
  const router = useRouter();

  const prefetchRoute = useCallback(async (route: string) => {
    try {
      // Prefetch the route
      router.prefetch(route);
      
      // Also prefetch common API endpoints for that route
      if (route.includes('/ogretmen/ogrenci/')) {
        const studentId = route.split('/').pop();
        if (studentId) {
          // Prefetch student data
          apiClient.get(`/api/teacher/students/${studentId}`, { cache: true });
          apiClient.get(`/api/teacher/students/${studentId}/stats`, { cache: true });
        }
      } else if (route.includes('/ogretmen/ogrenciler')) {
        // Prefetch students list
        apiClient.get('/api/teacher/students', { cache: true });
      } else if (route.includes('/ogrenci/')) {
        // Prefetch student dashboard data
        apiClient.get('/api/student/stats', { cache: true });
        apiClient.get('/api/student/assignments', { cache: true });
      }
    } catch (error) {
      console.warn('Prefetch failed for route:', route, error);
    }
  }, [router]);

  const prefetchOnHover = useCallback((route: string, options: PrefetchOptions = {}) => {
    const { enabled = true, delay = 200 } = options;
    
    if (!enabled) return;

    const timeoutId = setTimeout(() => {
      prefetchRoute(route);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [prefetchRoute]);

  return {
    prefetchRoute,
    prefetchOnHover,
  };
}

// Hook for prefetching on link hover
export function useLinkPrefetch(href: string, options: PrefetchOptions = {}) {
  const { prefetchOnHover } = usePrefetch();

  const handleMouseEnter = useCallback(() => {
    return prefetchOnHover(href, options);
  }, [href, prefetchOnHover, options]);

  return { handleMouseEnter };
}

// Hook for prefetching based on user role and current page
export function useSmartPrefetch() {
  const { prefetchRoute } = usePrefetch();

  useEffect(() => {
    // Prefetch common routes based on current path
    const currentPath = window.location.pathname;
    
    if (currentPath.startsWith('/ogretmen')) {
      // Prefetch common teacher routes
      setTimeout(() => {
        prefetchRoute('/ogretmen/ogrenciler');
        prefetchRoute('/ogretmen/odevler');
        prefetchRoute('/ogretmen/analiz');
      }, 1000);
    } else if (currentPath.startsWith('/ogrenci')) {
      // Prefetch common student routes
      setTimeout(() => {
        prefetchRoute('/ogrenci/odevler');
        prefetchRoute('/ogrenci/hedefler');
      // analiz sayfası kaldırıldı
      }, 1000);
    } else if (currentPath.startsWith('/admin')) {
      // Prefetch common admin routes
      setTimeout(() => {
        prefetchRoute('/admin/ogretmenler');
        prefetchRoute('/admin/istekler');
      }, 1000);
    }
  }, [prefetchRoute]);
}
