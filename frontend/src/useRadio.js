import { useEffect, useState } from 'react'
import { getRadio } from './api.js'

const POLL_MS = 30000

export function useRadio(crewId) {
  const [radio, setRadio] = useState(null)

  useEffect(() => {
    let alive = true
    const load = () => getRadio(crewId).then((r) => alive && setRadio(r)).catch(() => {})
    const onVisible = () => { if (document.visibilityState === 'visible') load() }

    load()
    const timer = setInterval(load, POLL_MS)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [crewId])

  return radio
}
