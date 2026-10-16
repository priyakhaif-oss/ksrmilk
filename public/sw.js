self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text() || 'You have a KSR Dairy Foods update.' }; }
  const title = data.title || 'KSR Dairy Foods';
  const options = {
    body: data.body || 'There is an update on your order.',
    icon: data.icon || '/icons/ksr-192.png',
    badge: data.icon || '/icons/ksr-192.png',
    data: { url: data.url || '/' },
    tag: data.tag || 'ksr-update',
    renotify: true
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    for (const client of clients) if (client.url.startsWith(self.location.origin) && 'focus' in client) return client.focus().then(c => c.navigate ? c.navigate(target) : c);
    return self.clients.openWindow(target);
  }));
});
