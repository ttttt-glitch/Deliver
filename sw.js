const CACHE_NAME = 'garowe-express-v22'; // ← bump version to force update
const ASSETS_TO_CACHE = [
    './index.html',
    './driver.html',
    './manifest.webmanifest',
    'https://cdn.tailwindcss.com'
];

// Install: cache the app shell
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                console.warn('Some assets failed to cache:', err);
            });
        })
    );
});

// Activate: delete old caches immediately
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: NETWORK-FIRST for HTML, cache-first for static assets
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // ✅ NEVER cache Supabase API calls — they must always be fresh
    if (url.hostname.includes('supabase.co')) {
        return; // Let the browser handle it normally
    }

    // ✅ NEVER cache JS modules — always fetch fresh from network
    // This prevents stale code from being served after deploys
    if (request.destination === 'script' || url.pathname.endsWith('.js')) {
        event.respondWith(
            fetch(request).catch(() => caches.match(request))
        );
        return;
    }

    // ✅ NETWORK-FIRST for HTML — always try network, fall back to cache
    // This ensures users always get the latest version of your pages
    if (request.mode === 'navigate' || request.destination === 'document') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Update cache with fresh version
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    return response;
                })
                .catch(() => caches.match(request).then(r => r || caches.match('./index.html')))
        );
        return;
    }

    // ✅ Cache-first for images, CSS, fonts, etc.
    event.respondWith(
        caches.match(request).then(cached => {
            return cached || fetch(request).then(response => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                return response;
            });
        })
    );
});
