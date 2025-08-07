const CACHE_NAME = 'studybuddy-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  // Add external resources
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/tesseract.min.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('StudyBuddy Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('StudyBuddy Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('StudyBuddy Service Worker: Cache failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('StudyBuddy Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('StudyBuddy Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.startsWith('https://cdnjs.cloudflare.com') &&
      !event.request.url.startsWith('https://cdn.jsdelivr.net')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('StudyBuddy Service Worker: Serving from cache:', event.request.url);
          return response;
        }

        console.log('StudyBuddy Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch((error) => {
        console.error('StudyBuddy Service Worker: Fetch failed:', error);
        
        // Return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for data synchronization
self.addEventListener('sync', (event) => {
  console.log('StudyBuddy Service Worker: Background sync triggered');
  
  if (event.tag === 'studybuddy-sync') {
    event.waitUntil(
      // Sync user data when back online
      syncUserData()
    );
  }
});

// Push notifications for study reminders
self.addEventListener('push', (event) => {
  console.log('StudyBuddy Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Time for your study session!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open-app',
        title: 'Open StudyBuddy',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('StudyBuddy Reminder', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('StudyBuddy Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'open-app') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync user data function
async function syncUserData() {
  try {
    // Get stored user data
    const userData = localStorage.getItem('studyBuddyUser');
    if (userData) {
      console.log('StudyBuddy Service Worker: Syncing user data...');
      // Here you would sync with your backend server
      // For now, we'll just log the sync attempt
      console.log('StudyBuddy Service Worker: User data sync completed');
    }
  } catch (error) {
    console.error('StudyBuddy Service Worker: Sync failed:', error);
  }
}

// Handle app shortcuts
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('StudyBuddy Service Worker: Loaded successfully');
