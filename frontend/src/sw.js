import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { onNotificationClick, onPush } from './swPush.js'

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => onPush(event, self.registration))
self.addEventListener('notificationclick', (event) => onNotificationClick(event, self.clients))
