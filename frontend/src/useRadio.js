import { useEffect, useRef, useState } from 'react'
import { getRadio } from './api.js'

// a safety net: pushes, focus and the app coming back already ask for a fresh state right away
const POLL_MS = 30000

/**
 * The radio state for the home. Reloaded every POLL_MS and, without waiting for the poll:
 * - when the service worker says something changed (a push arrived, or a notification was tapped with the app open),
 * - when the app comes back to the foreground or gets focus (a tap on a notification while the app is visible
 *   doesn't change visibility, so focus and pageshow cover it).
 * Responses can come back out of order: only the latest request is applied.
 */
export function useRadio(crewId) {
  const [state, setState] = useState({ radio: null, offline: false })
  const reloadRef = useRef(() => {})

  useEffect(() => {
    let alive = true
    let latest = 0
    const load = () => {
      const ticket = ++latest
      return getRadio(crewId)
        .then((radio) => alive && ticket === latest && setState({ radio, offline: false }))
        .catch(() => alive && ticket === latest && setState((s) => ({ ...s, offline: true })))
    }
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    const onWorker = (e) => { if (e.data?.type === 'refresh') load() }
    const worker = navigator.serviceWorker

    reloadRef.current = load
    load()
    const timer = setInterval(load, POLL_MS)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', load)
    window.addEventListener('pageshow', load)
    worker?.addEventListener?.('message', onWorker)
    return () => {
      alive = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', load)
      window.removeEventListener('pageshow', load)
      worker?.removeEventListener?.('message', onWorker)
    }
  }, [crewId])

  return { ...state, reload: () => reloadRef.current() }
}
