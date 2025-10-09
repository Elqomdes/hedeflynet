import { apiCache } from './cache';
import { measureApiCall } from './performance';
import { cacheBuster } from './cacheBuster';

interface ApiClientOptions {
  cache?: boolean;
  cacheTime?: number;
  retries?: number;
  timeout?: number;
  bustCache?: boolean;
}

class ApiClient {
  private baseURL: string;
  private defaultOptions: ApiClientOptions;

  constructor(baseURL: string = '', defaultOptions: ApiClientOptions = {}) {
    this.baseURL = baseURL;
    this.defaultOptions = {
      cache: true,
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retries: 3,
      timeout: 30000, // 30 seconds
      ...defaultOptions
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & ApiClientOptions = {}
  ): Promise<T> {
    return measureApiCall(async () => {
      const {
        cache = this.defaultOptions.cache,
        cacheTime = this.defaultOptions.cacheTime,
        retries = this.defaultOptions.retries,
        timeout = this.defaultOptions.timeout,
        bustCache = false,
        ...fetchOptions
      } = options;

      let url = `${this.baseURL}${endpoint}`;
      
      // Add cache busting if requested
      if (bustCache) {
        url = cacheBuster.addCacheBuster(url);
      }
      
      const cacheKey = apiCache.generateKey(endpoint, fetchOptions.body ? JSON.parse(fetchOptions.body as string) : {});

      // Check cache first (only if not busting cache)
      if (cache && !bustCache && fetchOptions.method !== 'POST' && fetchOptions.method !== 'PUT' && fetchOptions.method !== 'DELETE') {
        const cached = apiCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= (retries || 0); attempt++) {
        try {
          const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
            // Always send cookies for auth-protected endpoints
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...cacheBuster.getCacheBustingHeaders(),
              ...fetchOptions.headers,
            },
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            // Surface the exact status to guide retry/handling
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          // Cache successful responses
          if (cache && fetchOptions.method !== 'POST' && fetchOptions.method !== 'PUT' && fetchOptions.method !== 'DELETE') {
            apiCache.set(cacheKey, data, cacheTime);
          }

          return data;
        } catch (error) {
          lastError = error as Error;
          
          // Don't retry on abort or client errors (4xx)
          if (
            error instanceof Error && (
              error.name === 'AbortError' || /HTTP error! status: 4\d{2}/.test(error.message)
            )
          ) {
            break;
          }

          // Wait before retry (exponential backoff)
          if (attempt < (retries || 0)) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }

      clearTimeout(timeoutId);
      throw lastError || new Error('Request failed');
    });
  }

  async get<T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' } as any);
  }

  async post<T>(endpoint: string, data?: any, options: ApiClientOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    } as any);
  }

  async put<T>(endpoint: string, data?: any, options: ApiClientOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    } as any);
  }

  async delete<T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' } as any);
  }

  // Clear cache for specific endpoint or all cache
  clearCache(endpoint?: string): void {
    if (endpoint) {
      // This is a simplified implementation
      // In a real app, you'd want more sophisticated cache invalidation
      apiCache.clear();
    } else {
      apiCache.clear();
    }
  }
}

// Create default API client instance
export const apiClient = new ApiClient();

// Specialized clients for different endpoints
export const authApi = new ApiClient('', { cache: false });
export const teacherApi = new ApiClient('', { cache: true, cacheTime: 2 * 60 * 1000 });
export const studentApi = new ApiClient('', { cache: true, cacheTime: 3 * 60 * 1000 });
export const adminApi = new ApiClient('', { cache: true, cacheTime: 1 * 60 * 1000 });
