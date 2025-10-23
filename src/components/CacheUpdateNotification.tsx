'use client';

import React, { useState, useEffect } from 'react';
import { useAutoCacheBust } from '@/hooks/useAutoCacheBust';
import { RefreshCw, X, CheckCircle } from 'lucide-react';

export function CacheUpdateNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  
  const { manualBust, isChecking } = useAutoCacheBust({
    intervalMs: 2 * 60 * 1000,
    checkOnFocus: true,
    checkOnVisibilityChange: true,
    forceReloadOnUpdate: false // Manuel kontrol için false
  });

  useEffect(() => {
    // Sayfa yüklendiğinde cache kontrolü
    const checkCache = async () => {
      try {
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
            setUpdateMessage('Yeni güncellemeler mevcut! Sayfayı yenilemek için tıklayın.');
            setShowNotification(true);
          }
        }
      } catch (error) {
        console.error('Cache check failed:', error);
      }
    };

    // 5 saniye sonra kontrol et
    const timer = setTimeout(checkCache, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateMessage('Güncelleme yapılıyor...');
    
    try {
      await manualBust();
      setUpdateMessage('Güncelleme tamamlandı! Sayfa yenileniyor...');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setUpdateMessage('Güncelleme hatası! Lütfen sayfayı manuel olarak yenileyin.');
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
    setUpdateMessage('');
  };

  if (!showNotification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {isUpdating ? (
              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {isUpdating ? 'Güncelleme Yapılıyor' : 'Güncelleme Mevcut'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {updateMessage}
            </p>
            
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Güncelleniyor...
                  </>
                ) : (
                  'Şimdi Güncelle'
                )}
              </button>
              
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              >
                <X className="h-3 w-3 mr-1" />
                Daha Sonra
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
