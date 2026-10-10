// open windows reload the race state as soon as this arrives
const REFRESH = { type: 'refresh' }

const windowsOf = (clients) => clients.matchAll({ type: 'window', includeUncontrolled: true })

/** Tells every open window of the app to reload now. Never fails the push: the poll catches up anyway. */
export function refreshWindows(clients) {
  return windowsOf(clients)
    .then((windows) => windows.forEach((w) => w.postMessage?.(REFRESH)))
    .catch(() => {})
}

/** Shows the notification and, if the app is open, updates it straight away: no need to tap. */
export function onPush(event, registration, clients) {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(Promise.all([
    registration.showNotification(data.title || 'Race ENGENEer', {
      body: data.body || '',
      tag: data.tag,
      icon: '/icons/icon-192-v3.png',
      actions: Array.isArray(data.actions) ? data.actions : [],
      data: { url: data.url || '/', voteUrl: data.voteUrl || null }
    }),
    clients ? refreshWindows(clients) : Promise.resolve()
  ]))
}

/** "Open MNET+" opens the vote link; everything else brings the app forward, up to date (and to the proof card when asked). */
export function onNotificationClick(event, clients) {
  event.notification.close()
  const { url = '/', voteUrl = null } = event.notification.data || {}
  if (event.action === 'mnet' && voteUrl) {
    event.waitUntil(clients.openWindow(voteUrl))
    return
  }
  const wantsProof = event.action === 'proof' || url.includes('proof=1')
  event.waitUntil(
    windowsOf(clients).then((windows) => {
      const open = windows.find((w) => 'focus' in w)
      if (!open) return clients.openWindow(wantsProof ? '/?proof=1' : url)
      open.postMessage?.(REFRESH)
      if (wantsProof) open.postMessage?.({ type: 'proof' })
      return open.focus()
    })
  )
}
