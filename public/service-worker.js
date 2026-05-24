// =============================================
// SERVICE WORKER — SOP 3 Menit Yaumi Fatimah
// Versi: ganti angka ini setiap ada update besar
// =============================================
const CACHE_NAME = 'sop3menit-v1';

// File-file yang disimpan agar bisa dibuka offline
const CACHED_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.webmanifest',
];

// ── INSTALL: Simpan aset ke cache saat pertama dipasang ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHED_ASSETS).catch((err) => {
        // Jika ada file yang gagal di-cache, lanjutkan saja
        console.warn('Beberapa aset gagal di-cache:', err);
      });
    })
  );
  // Langsung aktif tanpa menunggu tab lama ditutup
  self.skipWaiting();
});

// ── ACTIVATE: Hapus cache lama saat versi baru aktif ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Langsung ambil kendali semua tab yang terbuka
  self.clients.claim();
});

// ── FETCH: Strategi "Network First, Cache Fallback" ──
// Selalu coba ambil data terbaru dari internet dulu.
// Jika internet mati, baru pakai versi yang tersimpan di cache.
self.addEventListener('fetch', (event) => {
  // Hanya tangani request HTTP/HTTPS, abaikan yang lain (misal chrome-extension)
  if (!event.request.url.startsWith('http')) return;

  // Jangan cache request ke Google Apps Script (data presensi harus selalu live)
  if (event.request.url.includes('script.google.com')) return;
  if (event.request.url.includes('googleapis.com')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Berhasil dari internet → simpan salinan ke cache
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      })
      .catch(() => {
        // Internet mati → ambil dari cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Jika tidak ada di cache dan tidak ada internet,
          // kembalikan halaman utama (agar tidak blank)
          return caches.match('/');
        });
      })
  );
});

// ── PUSH NOTIFICATION (opsional, untuk notifikasi dari server) ──
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'SOP 3 Menit', {
        body: data.body || '',
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
      })
    );
  } catch (e) {
    console.warn('Push notification error:', e);
  }
});

// ── NOTIFIKASI DIKLIK: Buka aplikasi ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Jika aplikasi sudah terbuka, fokus ke sana
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Jika belum terbuka, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
