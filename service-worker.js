const CACHE_NAME = 'intelligent-outlines-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  // The JS/TSX files are loaded via the importmap, but caching the entry points is good practice.
  // The browser will resolve them. The main thing is to cache the HTML shell.
  '/index.tsx', 
  '/manifest.json'
];

self.addEventListener('install', event => {
  // Perform install steps
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // We use addAll to fetch and cache all the assets in urlsToCache.
        // If any of the files fail to fetch, the whole service worker installation fails.
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // If a cache name is not in our whitelist, delete it.
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
      return;
  }

  // For navigation requests (i.e., when a user clicks a link or enters a URL),
  // we want to serve the index.html page. This is a common pattern for SPAs.
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.match('/index.html'));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // IMPORTANT: Clone the request. A request is a stream and
        // can only be consumed once. Since we are consuming this
        // once by cache and once by the browser for fetch, we need
        // to clone the response.
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            // We don't want to cache error pages or opaque responses (from third-party CDNs without CORS)
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = response.clone();

            // We don't block the fetch event on caching. Caching happens in the background.
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});
