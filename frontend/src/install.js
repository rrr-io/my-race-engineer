import { useEffect, useState } from 'react'
import { isAndroid, isStandalone } from './push.js'

// Chrome on Android offers its own install dialog once per page load, through this event. It can fire before React
// mounts, so it is caught here, at import time, and kept for when the fan taps Install.
let deferred = null
const listeners = new Set()
const notify = () => listeners.forEach((fn) => fn())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; notify() })
  window.addEventListener('appinstalled', () => { deferred = null; notify() })
}

const DISMISS_KEY = 'e1.installDismissed'

/**
 * Whether to offer installing the app on Android (iPhone has its own steps in the radio check, since push needs
 * the Home Screen there). canPrompt: Chrome's install dialog is available; otherwise the fan follows the menu steps.
 */
export function useInstall() {
  const [, setTick] = useState(0)
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })
  useEffect(() => {
    const fn = () => setTick((t) => t + 1)
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, [])

  const show = isAndroid() && !isStandalone() && !dismissed
  const install = async () => {
    if (!deferred) return
    const prompt = deferred
    deferred = null
    prompt.prompt()
    await prompt.userChoice.catch(() => null)
    notify()
  }
  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* no storage */ }
    setDismissed(true)
  }
  return { show, canPrompt: !!deferred, install, dismiss }
}
