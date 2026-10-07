import { deletePush, savePush } from './api.js'

const READY_TIMEOUT_MS = 5000

export const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches === true || navigator.standalone === true

const toKey = (base64Url) => {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

const registration = () =>
  Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) => setTimeout(() => reject(new Error('service worker not ready')), READY_TIMEOUT_MS))
  ])

export async function currentSubscription() {
  return (await registration()).pushManager.getSubscription()
}

export async function subscribe(crewId, publicKey) {
  // First thing, no awaits before it: iOS only shows the prompt while the tap is still fresh.
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('permission not granted')
  const reg = await registration()
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: toKey(publicKey)
  })
  await savePush(crewId, subscription.toJSON())
}

export async function unsubscribe(crewId) {
  const subscription = await currentSubscription()
  if (!subscription) return
  await deletePush(crewId, subscription.endpoint).catch(() => {})
  await subscription.unsubscribe()
}
