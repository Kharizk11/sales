const CACHE_NAME = 'sales-system-v3';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/styles.css',
    './css/sap-theme.css',
    './js/core/data.js',
    './js/core/utils.js',
    './js/core/config.js',
    './js/core/excel-handler.js',
    './js/pages/home.js',
    './js/pages/clean-sales.js',
    './js/pages/branches.js',
    './js/pages/analytics.js',
    './js/pages/ai-analytics.js',
    './js/pages/print-reports.js',
    './js/pages/settings.js'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching app shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                // Optionally cache new requests
                return fetchResponse;
            });
        }).catch(() => {
            // Fallback for offline if not in cache
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        })
    );
});
