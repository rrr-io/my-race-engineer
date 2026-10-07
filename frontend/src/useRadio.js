import { useEffect, useState } from 'react'
import { getRadio } from './api.js'

const POLL_MS = 30000

export function useRadio(crewId) {
  const [state, setState] = useState({ radio: null, offline: false })

  useEffect(() => {
    let alive = true
    const load = () =>
      getRadio(crewId)
        .then((radio) => alive && setState({ radio, offline: false }))
        .catch(() => alive && setState((s) => ({ ...s, offline: true })))
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

  return state
}
