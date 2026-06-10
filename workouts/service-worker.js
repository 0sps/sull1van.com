const CACHE_NAME = 'seans-log-v3';
const ASSETS_TO_CACHE = [
    './app.html',
    './training-plan-editor.html',
    './manifest.json',
    './apple-touch-icon.png',
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap'
];

// Install Event - Cache Core Assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch Event - Network First for app shell, Cache First for static assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Strategy: Network First for the app shell. User config data is cached by the app after Firebase reads.
    if (url.pathname.endsWith('app.html') || url.pathname.endsWith('training-plan-editor.html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Update cache with new version
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Default: Cache First, fall back to network
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
