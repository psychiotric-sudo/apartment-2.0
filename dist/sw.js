const CACHE_NAME = 'apt-manager-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/index.css',
  '/manifest.json',
  '/logo.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => {
          console.warn('Some assets could not be cached during installation:', err);
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'AptManager Update', body: 'You have a new update in your records.' };
  if (event.data) {
    try { data = event.data.json(); } catch (e) { data.body = event.data.text(); }
  }
  const options = { body: data.body, icon: '/logo.svg', badge: '/logo.svg', vibrate: [100, 50, 100] };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
