// This is the "Offline page" service worker

const CACHE = 'offline-page';

// TODO: replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "offline.html";
const offlineFallbackPage = 'offline.html';

// Install stage sets up the offline page in the cache and opens a new cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.add(offlineFallbackPage);
    })
  );
});

// If any fetch fails, it will show the offline page.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(error => {
      // The following validates that the request was for a navigation to a new document
      if (
        event.request.destination !== 'document' ||
        event.request.mode !== 'navigate'
      ) {
        return;
      }

      return caches.open(CACHE).then(cache => {
        return cache.match(offlineFallbackPage);
      });
    })
  );
});

// This is an event that can be fired from your page to tell the SW to update the offline page
self.addEventListener('refreshOffline', () => {
  const offlinePageRequest = new Request(offlineFallbackPage);

  return fetch(offlineFallbackPage).then(response => {
    return caches.open(CACHE).then(cache => {
      return cache.put(offlinePageRequest, response);
    });
  });
});
