const CACHE_PREFIX = 'seans-log-';
const CACHE_NAME = 'seans-log-v28';
// Keep the service worker focused on the app shell and static configuration.
const ASSETS_TO_CACHE = [
    './index.html',
    './app.html',
    './training-plan-editor.html',
    './progression.html',
    './body.html',
    './data.html',
    './js/config.js',
    './js/workout-date.js',
    './js/strength.js',
    './js/coach.js',
    './css/coach.css',
    './css/progression.css',
    './css/coach-modal.css',
    './js/records.js',
    './exercises.json',
    './training-plan.json',
    './progression-plan.json',
    './manifest.json',
    './apple-touch-icon.png',
    './maskable-icon.png',
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap'
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
const NETWORK_FIRST_STATIC_PATHS = new Set([
    '/workouts/js/workout-date.js',
    '/js/workout-date.js',
    '/workouts/exercises.json',
    '/exercises.json',
    '/workouts/training-plan.json',
    '/training-plan.json',
    '/workouts/progression-plan.json',
    '/progression-plan.json',
    '/workouts/js/coach.js',
    '/js/coach.js',
    '/workouts/css/coach.css',
    '/css/coach.css',
    '/workouts/css/progression.css',
    '/css/progression.css',
    '/workouts/css/coach-modal.css',
    '/css/coach-modal.css'
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

// Activate Event - Clean up old caches and take control of open pages.
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
        }).then(() => self.clients.claim())
    );
});

// Allow the page to activate a waiting worker immediately (used by the in-app
// "Update" prompt) so users aren't pinned to old code after a deploy.
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Fetch Event - Network First for the app shell and versioned configuration,
// Cache First for the remaining static assets.
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Versioned configuration must see the deployed copy before comparing dates.
    // Fall back to the last service-worker-cached version when offline.
    if (APP_SHELL_PATHS.has(url.pathname) || NETWORK_FIRST_STATIC_PATHS.has(url.pathname)) {
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
