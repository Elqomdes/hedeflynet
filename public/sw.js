// Service Worker for offline support and caching
const CACHE_NAME = `hedefly-v${Date.now()}`;
const STATIC_CACHE = `hedefly-static-v${Date.now()}`;
const API_CACHE = `hedefly-api-v${Date.now()}`;

// Files to cache for offline use
const STATIC_FILES = [
  '/',
  '/giris',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-32x32.png',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/auth/me',
  '/api/teacher/students',
  '/api/student/stats',
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Tüm eski cache'leri sil
            if (!cacheName.includes(STATIC_CACHE.split('-v')[0]) && 
                !cacheName.includes(API_CACHE.split('-v')[0])) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache busting için timestamp ekle
  const cacheBuster = `_cb=${Date.now()}`;
  const separator = url.search ? '&' : '?';
  const bustedUrl = `${url.origin}${url.pathname}${url.search}${separator}${cacheBuster}`;

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
        .then((response) => {
          // API isteklerini cache'leme
          return response;
        })
        .catch(() => {
          // Offline durumunda cache'den servis et
          return caches.open(API_CACHE)
            .then((cache) => {
              return cache.match(request)
                .then((cachedResponse) => {
                  if (cachedResponse) {
                    return cachedResponse;
                  }
                  
                  // Return offline response for API calls
                  return new Response(
                    JSON.stringify({ 
                      error: 'Offline', 
                      message: 'İnternet bağlantınızı kontrol edin' 
                    }),
                    {
                      status: 503,
                      statusText: 'Service Unavailable',
                      headers: { 'Content-Type': 'application/json' }
                    }
                  );
                });
            });
        })
    );
    return;
  }

  // Handle static file requests
  event.respondWith(
    fetch(request, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
      .then((response) => {
        // Don't cache non-GET requests or non-200 responses
        if (request.method !== 'GET' || !response.ok) {
          return response;
        }

        // Cache static files with cache busting
        const responseClone = response.clone();
        caches.open(STATIC_CACHE)
          .then((cache) => {
            cache.put(request, responseClone);
          });

        return response;
      })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/')
                .then((cachedPage) => {
                  if (cachedPage) {
                    return cachedPage;
                  }
                  
                  // Return basic offline page
                  return new Response(
                    `
                    <!DOCTYPE html>
                    <html lang="tr">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Çevrimdışı - Hedefly</title>
                      <style>
                        body { 
                          font-family: system-ui, -apple-system, sans-serif; 
                          margin: 0; 
                          padding: 20px; 
                          background: #f9fafb; 
                          text-align: center; 
                        }
                        .container { 
                          max-width: 400px; 
                          margin: 50px auto; 
                          background: white; 
                          padding: 40px; 
                          border-radius: 8px; 
                          box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
                        }
                        h1 { color: #374151; margin-bottom: 16px; }
                        p { color: #6b7280; margin-bottom: 24px; }
                        button { 
                          background: #3b82f6; 
                          color: white; 
                          border: none; 
                          padding: 12px 24px; 
                          border-radius: 6px; 
                          cursor: pointer; 
                        }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <h1>Çevrimdışısınız</h1>
                        <p>İnternet bağlantınızı kontrol edin ve tekrar deneyin.</p>
                        <button onclick="window.location.reload()">Tekrar Dene</button>
                      </div>
                    </body>
                    </html>
                    `,
                    {
                      status: 200,
                      statusText: 'OK',
                      headers: { 'Content-Type': 'text/html' }
                    }
                  );
                });
            }
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('Background sync triggered')
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon-32x32.png',
      badge: '/favicon-32x32.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'Görüntüle',
          icon: '/favicon-32x32.png'
        },
        {
          action: 'close',
          title: 'Kapat',
          icon: '/favicon-32x32.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
