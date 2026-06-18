const CACHE_PREFIX = 'seans-log-';
const CACHE_NAME = 'seans-log-v4';
// Keep the service worker focused on the app shell. exercises/trainingPlan/
// progressionPlan are user config data now, cached by page code after Firebase reads.
const ASSETS_TO_CACHE = [
    './index.html',
    './app.html',
    './training-plan-editor.html',
    './progression.html',
    './body.html',
    './data.html',
    './js/coach.js',
    './exercises.json',
    './training-plan.json',
    './progression-plan.json',
    './manifest.json',
    './apple-touch-icon.png',
    './maskable-icon.png',
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap'
];
const APP_SHELL_PATHS = new Set([
    '/workouts/index.html',
    '/workouts/app.html',
    '/workouts/training-plan-editor.html',
    '/workouts/progression.html',
    '/workouts/body.html',
    '/workouts/data.html',
    '/index.html',
    '/app.html',
    '/training-plan-editor.html',
    '/progression.html',
    '/body.html',
    '/data.html'
]);

// Install Event - Cache Core Assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return Promise.allSettled(
                    ASSETS_TO_CACHE.map((asset) => cache.add(asset))
                );
            })
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch Event - Network First for app shell, Cache First for static assets.
// Do not special-case bundled JSON here; it is only a seed/emergency fallback.
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Strategy: Network First for the app shell. User config data is cached by the app after Firebase reads.
    if (APP_SHELL_PATHS.has(url.pathname)) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        // Update cache with new version
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
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
