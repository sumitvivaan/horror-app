// public/sw.js - साया ऐप वेब पुश सर्विस वर्कर
self.addEventListener('push', function (event) {
  let data = { title: 'साया 👻', body: 'कुछ नया और खौफ़नाक आया है... 💀', url: '/' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'saaya', body: event.data.text(), url: '/' };
    }
  }

  const options = {
    body: data.body,
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [300, 100, 400, 100, 400, 100, 400], // खौफनाक वाइब्रेशन सायरन
    data: {
      url: data.url
    },
    actions: [
      { action: 'open', title: '🎧 अभी सुनो' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  let targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});