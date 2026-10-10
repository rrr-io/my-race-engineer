import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Headset } from './RaceHeader.jsx'

const DONE_KEY = 'e1.formationLap'
const STEPS = ['radio', 'status', 'calendar', 'gokart']
const PAD = 6

export function formationLapDone() {
  try { return localStorage.getItem(DONE_KEY) === 'done' } catch { return true }
}

function rememberDone() {
  try { localStorage.setItem(DONE_KEY, 'done') } catch { /* no storage: it may show again */ }
}

const target = (step) => document.querySelector(`[data-tour="${step}"]`)

function measure(el) {
  const r = el.getBoundingClientRect()
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 }
}

/**
 * The Formation Lap: a four-step tour of the home the first time a fan gets there, like the lap before the start.
 * A spotlight on the real element and one line from the engineer, in the team's voice: the radio feed, the race
 * status, the race calendar (the fan taps it for real) and the Go Kart practice race. Skip any time; it can be
 * replayed from the header.
 */
export default function FormationLap({ team, onPractice, onClose }) {
  const [index, setIndex] = useState(0)
  const [hole, setHole] = useState(null)
  const [tapped, setTapped] = useState(false)
  const primary = useRef(null)
  const step = STEPS[index]
  const last = index === STEPS.length - 1

  const finish = useCallback(() => { rememberDone(); onClose() }, [onClose])
  const next = useCallback(() => {
    if (last) finish()
    else { setIndex((i) => i + 1); setTapped(false) }
  }, [last, finish])

  // bring the element into view and follow it while the page moves
  useLayoutEffect(() => {
    const el = target(step)
    if (!el) { next(); return undefined }
    el.scrollIntoView?.({ block: 'center' })
    const update = () => { const now = target(step); if (now) setHole(measure(now)) }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null
    observer?.observe(el)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      observer?.disconnect()
    }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  // the calendar step is done for real: the fan taps the band
  useEffect(() => {
    if (step !== 'calendar') return undefined
    const el = target(step)
    const onTap = () => setTapped(true)
    el?.addEventListener('click', onTap)
    return () => el?.removeEventListener('click', onTap)
  }, [step])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') finish() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [finish])

  useEffect(() => { primary.current?.focus() }, [index, tapped])

  if (!hole) return null

  // the card sits on the side of the screen away from the spotlight
  const low = hole.top + hole.height / 2 > window.innerHeight / 2
  // only the calendar can be touched through the spotlight
  const through = step === 'calendar'
  const line = step === 'calendar' && tapped
    ? 'Add the race weekend to your calendar from here, any time.'
    : team.tour[index]

  return (
    <div className="lap" role="dialog" aria-modal="true" aria-labelledby="lap-title">
      <div className="lap-shade" style={{ top: 0, left: 0, right: 0, height: Math.max(hole.top, 0) }} />
      <div className="lap-shade" style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
      <div className="lap-shade" style={{ top: hole.top, left: 0, width: Math.max(hole.left, 0), height: hole.height }} />
      <div className="lap-shade" style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
      <div className={`lap-hole ${through && !tapped ? 'is-tap' : ''}`}
           style={{ ...hole, pointerEvents: through ? 'none' : 'auto' }} aria-hidden="true" />

      <section className={`lap-card ${low ? 'is-top' : 'is-bottom'}`}>
        <div className="lap-head">
          <span className="eyebrow" id="lap-title">FORMATION LAP · {index + 1}/{STEPS.length}</span>
          <span className="lap-dots" aria-hidden="true">
            {STEPS.map((s, i) => <span key={s} className={i <= index ? 'is-done' : ''} />)}
          </span>
        </div>
        <div className="radio-label"><Headset size={16} strokeWidth={2.4} />RADIO · ENGENEer</div>
        <p className="lap-line" aria-live="polite">"{line}"</p>
        {step === 'calendar' && !tapped && <p className="lap-hint">TAP THE CALENDAR {low ? '↓' : '↑'}</p>}
        <div className="lap-actions">
          {last ? (
            <>
              <button type="button" className="btn-secondary" onClick={finish}>Later</button>
              <button type="button" className="btn-primary" ref={primary} onClick={() => { finish(); onPractice?.() }}>
                Start practice
              </button>
            </>
          ) : step === 'calendar' && !tapped ? (
            <>
              <button type="button" className="btn-link" onClick={finish}>Skip</button>
              <button type="button" className="btn-secondary" ref={primary} onClick={next}>Next</button>
            </>
          ) : (
            <>
              <button type="button" className="btn-link" onClick={finish}>Skip</button>
              <button type="button" className="btn-primary" ref={primary} onClick={next}>Next</button>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
