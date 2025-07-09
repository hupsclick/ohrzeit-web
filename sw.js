// sw.js
const CACHE_NAME = 'ohrzeit-v3'; // Cache-Version erhöht
const urlsToCache = [
  '/',
  '/index.html', // Angepasst an deine Hauptseite
  '/style.css', // Falls du eine separate CSS-Datei hast
  '/script.js',
  '/bilder/logo.svg',
  '/bilder/logo.png',
  '/bilder/logo-180.png',
  '/bilder/logo-192.png',
  '/bilder/logo-512.png',
  '/bilder/cover.png',
  '/bilder/cover-180.png',
  '/bilder/cover-192.png',
  '/bilder/cover-512.png',
  '/bilder/favicon.ico',
  '/bilder/favicon-180.ico',
  '/bilder/favicon-192.ico',
  '/bilder/favicon-512.ico',
  '/manifest.json',
  '/impressum.html', // Falls vorhanden
  '/datenschutz.html', // Falls vorhanden
  '/offline.html'
];

const addResourcesToCache = async (resources) => {
  const cache = await caches.open(CACHE_NAME);
  try {
    await cache.addAll(resources);
    console.log('Ressourcen erfolgreich gecacht:', resources);
  } catch (err) {
    console.error('Fehler beim Caching der Ressourcen:', err, resources);
  }
};

const putInCache = async (request, response) => {
  const cache = await caches.open(CACHE_NAME);
  try {
    await cache.put(request, response);
    console.log('Ressource im Cache gespeichert:', request.url);
  } catch (err) {
    console.error('Fehler beim Speichern im Cache:', err, request.url);
  }
};

const cacheFirst = async ({ request, fallbackUrl }) => {
  try {
    // Versuche, die Ressource aus dem Cache zu holen
    const responseFromCache = await caches.match(request);
    if (responseFromCache) {
      console.log('Cache-Treffer:', request.url);
      return responseFromCache;
    }

    // Versuche, die Ressource aus dem Netzwerk zu holen
    const responseFromNetwork = await fetch(request.clone());
    await putInCache(request, responseFromNetwork.clone());
    console.log('Netzwerk-Antwort:', request.url);
    return responseFromNetwork;
  } catch (error) {
    const fallbackResponse = await caches.match(fallbackUrl);
    if (fallbackResponse) {
      console.log('Fallback-Seite geladen:', fallbackUrl);
      return fallbackResponse;
    }
    console.error('Netzwerkfehler:', error, request.url);
    return new Response('Netzwerkfehler aufgetreten', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(addResourcesToCache(urlsToCache));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    cacheFirst({
      request: event.request,
      fallbackUrl: '/offline.html'
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Alten Cache löschen:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});