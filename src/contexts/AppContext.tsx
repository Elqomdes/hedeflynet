'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { cacheBuster } from '@/lib/cacheBuster';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  firstName: string;
  lastName: string;
  phone?: string;
}

interface AppState {
  user: User | null;
  loading: boolean;
  error: string | null;
  lastActivity: number;
  isOnline: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_ACTIVITY' }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'LOGOUT' };

const initialState: AppState = {
  user: null,
  loading: true,
  error: null,
  lastActivity: Date.now(),
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'UPDATE_ACTIVITY':
      return { ...state, lastActivity: Date.now() };
    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, loading: false, error: null };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const router = useRouter();
  const { isSupported: swSupported, isRegistered: swRegistered } = useServiceWorker();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: { 
            ...cacheBuster.getCacheBustingHeaders()
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            dispatch({ type: 'SET_USER', payload: data.user });
          } else {
            dispatch({ type: 'SET_USER', payload: null });
          }
        } else {
          dispatch({ type: 'SET_USER', payload: null });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Authentication failed' });
      }
    };

    checkAuth();
  }, []);

  // Track user activity with throttling for better performance
  useEffect(() => {
    let lastUpdate = 0;
    const throttleDelay = 5000; // Update max once per 5 seconds
    
    const updateActivity = () => {
      const now = Date.now();
      if (now - lastUpdate >= throttleDelay) {
        lastUpdate = now;
        dispatch({ type: 'UPDATE_ACTIVITY' });
      }
    };

    // Use passive listeners for better scroll performance
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const options = { passive: true, capture: true };
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, options);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, options);
      });
    };
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-refresh auth every 5 minutes if user is active
  useEffect(() => {
    if (!state.user) return;

    const interval = setInterval(async () => {
      const timeSinceActivity = Date.now() - state.lastActivity;
      if (timeSinceActivity < 10 * 60 * 1000) { // 10 minutes
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
            headers: { 
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              dispatch({ type: 'SET_USER', payload: data.user });
            } else {
              dispatch({ type: 'LOGOUT' });
            }
          }
        } catch (error) {
          console.error('Auth refresh failed:', error);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [state.user, state.lastActivity]);

  const login = useCallback((user: User) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      router.push('/');
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: { 
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_USER', payload: data.user || null });
      } else {
        dispatch({ type: 'SET_USER', payload: null });
      }
    } catch (error) {
      console.error('User refresh failed:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh user data' });
    }
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, login, logout, refreshUser }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
