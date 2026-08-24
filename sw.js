const CACHE_NAME = 'programa-consultorio-dental-v4-20260823-loading-shell-v29';

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.add(new Request('./app.html', { cache: 'reload' })))
      .catch(() => undefined)
  );
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

  // Preparar una copia en cuanto llegan los encabezados, pero entregar la
  // respuesta original al navegador sin esperar a que termine cache.put().
  // Antes se retenía todo el HTML mientras se escribía la copia offline y la
  // pestaña permanecía blanca varios segundos.
  const preparedResponse = fetch(networkRequest).then(response => ({
    response,
    cacheCopy: response && response.ok ? response.clone() : null
  }));

  event.respondWith(
    preparedResponse
      .then(result => result.response)
      .catch(() => caches.match(request).then(cached => cached || caches.match('./app.html')))
  );

  event.waitUntil(
    preparedResponse.then(result => {
      if (!result.cacheCopy) return undefined;
      const cacheKey = isAppDocument ? './app.html' : request;
      return caches.open(CACHE_NAME).then(cache => cache.put(cacheKey, result.cacheCopy));
    }).catch(() => undefined)
  );
});
