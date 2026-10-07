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
      actions: Array.isArray(data.actions) ? data.actions : [],
      data: { url: data.url || '/', voteUrl: data.voteUrl || null }
    })
  )
}

/** "Open MNET+" opens the vote link; everything else brings the app forward (and to the proof card when asked). */
export function onNotificationClick(event, clients) {
  event.notification.close()
  const { url = '/', voteUrl = null } = event.notification.data || {}
  if (event.action === 'mnet' && voteUrl) {
    event.waitUntil(clients.openWindow(voteUrl))
    return
  }
  const wantsProof = event.action === 'proof' || url.includes('proof=1')
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => 'focus' in w)
      if (!open) return clients.openWindow(wantsProof ? '/?proof=1' : url)
      if (wantsProof) open.postMessage?.({ type: 'proof' })
      return open.focus()
    })
  )
}
