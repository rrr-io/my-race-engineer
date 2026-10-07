export function onPush(event, registration) {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    registration.showNotification(data.title || 'Race Engineer', {
      body: data.body || '',
      tag: data.tag,
      icon: '/icons/icon-192-v2.png',
      data: { url: data.url || '/' }
    })
  )
}

export function onNotificationClick(event, clients) {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => 'focus' in w)
      return open ? open.focus() : clients.openWindow(url)
    })
  )
}
