const VERSION = 'scopestamp-v5';
const SHELL = ['/', '/index.html', '/offline.html', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png', '/assets/scopestamp-notebook.webp', '/assets/scopestamp-notebook-768.webp'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    const fresh = async path => {
      const response = await fetch(new Request(path, { cache: 'reload' }));
      if (!response.ok) throw new Error(`Could not precache ${path}`);
      await cache.put(path, response);
    };
    await Promise.all(SHELL.map(fresh));
    const index = await fetch(new Request('/index.html', { cache: 'reload' }));
    const html = await index.clone().text();
    const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(match => match[1]);
    await cache.put('/index.html', index);
    await Promise.all(builtAssets.map(fresh));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(VERSION).then(cache => cache.put('/index.html', copy));
      return response;
    }).catch(async () => (await caches.match('/index.html', { ignoreVary: true })) || (await caches.match('/offline.html', { ignoreVary: true }))));
    return;
  }

  event.respondWith(caches.match(event.request, { ignoreVary: true }).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) caches.open(VERSION).then(cache => cache.put(event.request, response.clone()));
    return response;
  })));
});
