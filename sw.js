const CACHE_NAME = 'programa-consultorio-dental-v4-20260806-startup-loader-v14';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isAppDocument =
    request.mode === 'navigate' ||
    url.pathname.endsWith('/app.html') ||
    url.pathname.endsWith('/');

  const networkRequest = isAppDocument
    ? new Request(request, { cache: 'no-store' })
    : request;

  event.respondWith(
    fetch(networkRequest).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        const cacheKey = isAppDocument ? './app.html' : request;
        return caches.open(CACHE_NAME)
          .then(cache => cache.put(cacheKey, copy))
          .then(() => response);
      }
      return response;
    }).catch(() => caches.match(request).then(cached => cached || caches.match('./app.html')))
  );
});
