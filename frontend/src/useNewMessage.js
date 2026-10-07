import { useCallback, useEffect, useRef, useState } from 'react'

export const messageKey = (m) => `${m.kind}|${m.text}`

const storeKey = (crewId) => `e1.seen.${crewId}`
const read = (crewId) => {
  try {
    const raw = localStorage.getItem(storeKey(crewId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
const write = (crewId, keys) => {
  try {
    localStorage.setItem(storeKey(crewId), JSON.stringify(keys.slice(-60)))
  } catch {
    /* no storage: the glow just won't survive a reload */
  }
}

/**
 * The newest message the fan has not seen yet. Messages count as seen when they tap it, when they leave the
 * app, and on the very first visit (nothing is "new" the first time).
 */
export function useNewMessage(crewId, messages) {
  const [seen, setSeen] = useState(() => read(crewId))
  const keys = (messages ?? []).map(messageKey)
  const latest = useRef({ seen, keys })
  latest.current = { seen, keys }

  const markSeen = useCallback(() => {
    const { seen: current, keys: now } = latest.current
    const next = [...new Set([...(current ?? []), ...now])]
    write(crewId, next)
    setSeen(next)
  }, [crewId])

  useEffect(() => {
    if (messages && seen === null) markSeen()
  }, [messages, seen, markSeen])

  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') markSeen() }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [markSeen])

  const unseen = seen ? keys.filter((k) => !seen.includes(k)) : []
  return { newKey: unseen.length ? unseen[unseen.length - 1] : null, dismiss: markSeen }
}
