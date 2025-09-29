'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthWrapperProps {
  children: React.ReactNode;
  requiredRole: string;
  fallbackPath: string;
}

export default function AuthWrapper({ children, requiredRole, fallbackPath }: AuthWrapperProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user.role === requiredRole) {
            setUser(data.user);
          } else {
            router.push(fallbackPath);
          }
        } else {
          router.push('/giris');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/giris');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [requiredRole, fallbackPath, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

