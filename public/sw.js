// Service Worker for DBAQ LMS
// Self-maintaining pass-through service worker to handle browser PWA requests cleanly

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Let network handle all requests naturally
});
