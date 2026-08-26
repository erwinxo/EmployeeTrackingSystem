self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const payload = event.data.json();
      const options = {
        body: payload.body,
        icon: '/Logo1.png',
        badge: '/Logo1.png',
        data: payload.data,
        vibrate: [100, 50, 100],
      };
      event.waitUntil(
        self.registration.showNotification(payload.title, options)
      );
    } catch (err) {
      console.error('Failed to parse push event payload:', err);
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a chat window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes('/chat') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new chat window
      if (clients.openWindow) {
        return clients.openWindow('/chat');
      }
    })
  );
});
