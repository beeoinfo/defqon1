const CACHE_PREFIX = 'beeoinfo-pwa';
const APP_CACHE = `${CACHE_PREFIX}-app-v3`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-v1`;
const NAVIGATION_FALLBACK_URL = '/';
const APP_SHELL_URLS = [
  NAVIGATION_FALLBACK_URL,
  '/defqon1/site.webmanifest?v=20260510',
  '/insane/site.webmanifest?v=20260510',
];

const isSameOriginRequest = (request) => {
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch {
    return false;
  }
};

const cacheResponse = async (cacheName, request, response) => {
  if (!response || response.status >= 400) {
    return;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
};

const networkFirst = async (request, fallbackUrl = null) => {
  try {
    const response = await fetch(request);
    await cacheResponse(APP_CACHE, fallbackUrl ?? request, response);
    return response;
  } catch {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    if (fallbackUrl) {
      const fallbackResponse = await caches.match(fallbackUrl);

      if (fallbackResponse) {
        return fallbackResponse;
      }
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Offline',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
};

const staleWhileRevalidate = async (request) => {
  const cachedResponse = await caches.match(request);
  const networkResponsePromise = fetch(request)
    .then(async (response) => {
      await cacheResponse(RUNTIME_CACHE, request, response);
      return response;
    })
    .catch(() => undefined);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await networkResponsePromise;

  return networkResponse ?? new Response('Offline', {
    status: 503,
    statusText: 'Offline',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX))
          .filter((cacheName) => cacheName !== APP_CACHE && cacheName !== RUNTIME_CACHE)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, NAVIGATION_FALLBACK_URL));
    return;
  }

  if (!isSameOriginRequest(request)) {
    return;
  }

  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'manifest'
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
