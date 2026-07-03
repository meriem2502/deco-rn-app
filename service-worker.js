/* service-worker.js - Gestion du cache hors-ligne pour DECO RN ADMIN */
const CACHE_NAME = 'deco-rn-admin-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/commandes.html',
  '/nouvelle.html',
  '/modifier.html',
  '/produits.html',
  '/clientes.html',
  '/calendrier.html',
  '/statistiques.html',
  '/parametres.html',
  '/css/style.css',
  '/css/dashboard.css',
  '/css/table.css',
  '/css/forms.css',
  '/css/calendar.css',
  '/js/database.js',
  '/js/dashboard.js',
  '/js/commandes.js',
  '/js/produits.js',
  '/js/clientes.js',
  '/js/calendar.js',
  '/js/stats.js',
  '/js/auth.js',
  '/js/ui.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
