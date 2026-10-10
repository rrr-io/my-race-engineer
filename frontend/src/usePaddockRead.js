import { useEffect, useRef, useState } from 'react'

// Gone this long, it counts as opening the app again (same idea as the splash's start lights).
const AWAY_MS = 10 * 60 * 1000
const KEEP = 100

const storeKey = (crewId) => `e1.paddockRead.${crewId}`
const read = (crewId) => {
  try {
    const raw = localStorage.getItem(storeKey(crewId))
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}
const write = (crewId, ids) => {
  try {
    localStorage.setItem(storeKey(crewId), JSON.stringify([...ids].slice(-KEEP)))
  } catch {
    /* no storage: announcements just stay for their 48 hours */
  }
}

/**
 * Paddock announcements (fanchants and messages) are read once: when one has been on screen, it's gone the next time
 * the fan opens the app (a reload, or coming back after a while). While the app stays open it stays put, so nothing
 * vanishes under the fan's eyes. Each article carries data-paddock-id; it counts as read when most of it was visible.
 */
export function usePaddockRead(crewId, messages) {
  const [hidden, setHidden] = useState(() => read(crewId))
  const readIds = useRef(read(crewId))
  const leftAt = useRef(null)

  const ids = (messages ?? []).filter((m) => m.from === 'PADDOCK' && m.id != null).map((m) => m.id)
  const present = ids.join(',')

  // watch what's on screen
  useEffect(() => {
    if (!messages) return undefined
    const current = new Set(ids)
    // forget announcements the server no longer sends (past their 48 hours, or removed by Race Control)
    const kept = new Set([...readIds.current].filter((id) => current.has(id)))
    if (kept.size !== readIds.current.size) { readIds.current = kept; write(crewId, kept) }

    const mark = (id) => {
      if (readIds.current.has(id)) return
      readIds.current.add(id)
      write(crewId, readIds.current)
    }
    const nodes = document.querySelectorAll('[data-paddock-id]')
    if (typeof IntersectionObserver !== 'function') {
      nodes.forEach((n) => mark(Number(n.dataset.paddockId)))
      return undefined
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) mark(Number(e.target.dataset.paddockId)) })
    }, { threshold: 0.6 })
    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [crewId, present]) // eslint-disable-line react-hooks/exhaustive-deps

  // coming back after a while is a new opening: what was read disappears
  useEffect(() => {
    const onChange = () => {
      if (document.visibilityState === 'hidden') { leftAt.current = Date.now(); return }
      if (leftAt.current && Date.now() - leftAt.current >= AWAY_MS) setHidden(new Set(readIds.current))
      leftAt.current = null
    }
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return { isHidden: (m) => m.from === 'PADDOCK' && m.id != null && hidden.has(m.id) }
}
