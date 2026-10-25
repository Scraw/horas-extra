// Service worker: guarda la app para que funcione sin conexión. La caché cambia con cada versión (js/config.js).
importScripts('js/config.js');

const CACHE = 'rhe-' + self.CONFIG.VERSION;
const ARCHIVOS = [
  './', // la página; no se precarga 'index.html' porque Cloudflare la redirige a './'
  'manifest.webmanifest',
  'css/estilos.css',
  'js/config.js',
  'js/app.js',
  'js/almacen.js',
  'js/dominio.js',
  'js/formato.js',
  'js/pdf.js',
  'js/textos.js',
  'vendor/jspdf.umd.min.js',
  'vendor/jspdf.plugin.autotable.min.js',
  'iconos/icono.svg',
  'iconos/icono-192.png',
  'iconos/icono-512.png',
  'iconos/icono-maskable-512.png',
  'iconos/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ARCHIVOS.map((a) => new Request(a, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k.startsWith('rhe-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((r) => r ?? fetch(e.request).catch(() => caches.match('./'))),
  );
});
