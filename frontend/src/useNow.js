import { useEffect, useState } from 'react'

/** The current time, refreshed every `everyMs` and when the app comes back to the foreground. */
export function useNow(everyMs = 30000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const timer = setInterval(tick, everyMs)
    const onVisible = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [everyMs])
  return now
}
