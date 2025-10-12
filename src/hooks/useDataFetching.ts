import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheBuster } from '@/lib/cacheBuster';

interface UseDataFetchingOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  cacheTime?: number;
  retry?: number;
  retryDelay?: number;
  bustCache?: boolean;
}

interface UseDataFetchingResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isStale: boolean;
}

// Simple cache for client-side data
const clientCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function useDataFetching<T>(
  url: string,
  options: UseDataFetchingOptions = {}
): UseDataFetchingResult<T> {
  const {
    enabled = true,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    retry = 3,
    retryDelay = 1000,
    bustCache = false
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const retryCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled || !mountedRef.current) return;

    // Check cache first (only if not busting cache)
    if (!forceRefresh && !bustCache) {
      const cached = clientCache.get(url);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        setData(cached.data);
        setIsStale(Date.now() - cached.timestamp > staleTime);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const fetchUrl = bustCache ? cacheBuster.addCacheBuster(url) : url;
      
      const response = await fetch(fetchUrl, {
        // Ensure cookies are sent for auth-protected resources
        credentials: 'include',
        headers: {
          ...cacheBuster.getCacheBustingHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (mountedRef.current) {
        setData(result);
        setIsStale(false);
        
        // Cache the result (only if not busting cache)
        if (!bustCache) {
          clientCache.set(url, {
            data: result,
            timestamp: Date.now(),
            ttl: cacheTime
          });
        }
        
        retryCountRef.current = 0;
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        
        // Retry logic
        if (retryCountRef.current < retry) {
          retryCountRef.current++;
          setTimeout(() => {
            if (mountedRef.current) {
              fetchData(forceRefresh);
            }
          }, retryDelay * retryCountRef.current);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [url, enabled, staleTime, cacheTime, retry, retryDelay, bustCache]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (enabled) {
      fetchData();
    }

    // Set up refetch interval
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          fetchData();
        }
      }, refetchInterval);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, enabled, refetchInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    isStale
  };
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>(
  url: string,
  options: UseDataFetchingOptions = {}
) {
  const { data, loading, error, refetch } = useDataFetching<T>(url, options);
  const [optimisticData, setOptimisticData] = useState<T | null>(null);

  const updateOptimistically = useCallback((updater: (current: T | null) => T) => {
    setOptimisticData(updater(data));
  }, [data]);

  const commitUpdate = useCallback(async () => {
    setOptimisticData(null);
    await refetch();
  }, [refetch]);

  const rollbackUpdate = useCallback(() => {
    setOptimisticData(null);
  }, []);

  return {
    data: optimisticData || data,
    loading,
    error,
    refetch,
    updateOptimistically,
    commitUpdate,
    rollbackUpdate,
    isOptimistic: optimisticData !== null
  };
}
