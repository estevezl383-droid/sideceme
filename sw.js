// ============================================================
// SIDECEME — Service Worker (recibe notificaciones push con la app cerrada)
// Debe estar en la raíz del sitio (junto a index.html). Subir a GitHub como sw.js.
// ============================================================
const ICONO = 'assets/icon-sideceme.png';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Llega un push del servidor → mostrar la notificación
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { data = { body: event.data ? event.data.text() : '' }; }

  const title = data.title || 'SIDECEME';
  const options = {
    body: data.body || '',
    icon: data.icon || ICONO,
    badge: ICONO,
    vibrate: [120, 60, 120],
    tag: data.tag || undefined,          // mismo tag = reemplaza la anterior
    renotify: !!data.tag,
    data: { url: data.url || './' }
  };
  // Número rojo en el ícono si el aviso lo incluye
  if (typeof data.badge === 'number' && 'setAppBadge' in navigator) {
    try { if (data.badge > 0) navigator.setAppBadge(data.badge); else navigator.clearAppBadge(); } catch (e) {}
  }
  event.waitUntil(self.registration.showNotification(title, options));
});

// Al tocar la notificación → abrir/enfocar la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destino = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const c of lista) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(destino);
    })
  );
});
