const CACHE_NAME = 'mistake-notebook-v3';
const APP_SHELL = [
  './MistakeNotebook.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first, and *not* just in the sense of "try fetch() before cache" —
// { cache: 'reload' } tells the browser to skip its own HTTP cache too and
// genuinely ask the server, so a page can't get stuck on a stale copy from
// ordinary HTTP caching underneath this logic. Falls back to the cached app
// shell only when there's truly no network.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request, { cache: 'reload' })
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./MistakeNotebook.html'))
      )
  );
});
