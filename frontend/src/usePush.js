import { useEffect, useState } from 'react'
import { getPushKey, savePush } from './api.js'
import { currentSubscription, isIOS, isStandalone, pushSupported, subscribe, unsubscribe } from './push.js'

// status: loading | hidden | install | unsupported | blocked | ask | on
export function usePush(crewId) {
  const [status, setStatus] = useState('loading')
  const [publicKey, setPublicKey] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    const show = (s) => { if (alive) setStatus(s) }

    ;(async () => {
      const key = await getPushKey().catch(() => null)
      if (!key?.enabled) return show('hidden')
      if (alive) setPublicKey(key.publicKey)
      if (!pushSupported()) return show(isIOS() && !isStandalone() ? 'install' : 'unsupported')
      if (Notification.permission === 'denied') return show('blocked')
      try {
        const subscription = Notification.permission === 'granted' ? await currentSubscription() : null
        if (subscription) {
          await savePush(crewId, subscription.toJSON()).catch(() => {})
          return show('on')
        }
        show('ask')
      } catch {
        show('unsupported')
      }
    })()

    return () => { alive = false }
  }, [crewId])

  const enable = async () => {
    setBusy(true); setError(null)
    try {
      await subscribe(crewId, publicKey)
      setStatus('on')
    } catch {
      if (Notification.permission === 'denied') setStatus('blocked')
      else setError("Couldn't turn on notifications. Try again.")
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true); setError(null)
    try {
      await unsubscribe(crewId)
      setStatus('ask')
    } catch {
      setError("Couldn't turn off notifications. Try again.")
    } finally {
      setBusy(false)
    }
  }

  return { status, busy, error, enable, disable }
}
