import { useEffect, useRef, useState } from 'react'
import { Headset } from './RaceHeader.jsx'
import { teamStyle } from './teams.js'

const LIGHT_MS = 320              // the lights come on one every 0.32 s, whatever the network does
const OUT_MS = 380                // all off for a beat, then the app
const LEAVE_MS = 250              // fade to the app
const HOLD_AFTER_MS = 8000        // then "can't reach the pit wall"
const AWAY_MS = 3 * 60 * 60 * 1000 // gone longer than this: the start lights; otherwise just the radio wave
const NEUTRAL = '#E10600'
const SEEN_KEY = 'e1.lastSeen'

const BARS = [10, 18, 28, 16, 32, 16, 28, 18, 10]

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/** When the fan last had the app on screen; kept up to date while they use it. */
export function rememberSeen() {
  try { localStorage.setItem(SEEN_KEY, String(Date.now())) } catch { /* no storage */ }
}

/** The start lights after a long absence (or the very first time), the radio wave on a quick reopen. */
export function splashMode() {
  let last = null
  try { last = Number(localStorage.getItem(SEEN_KEY)) || null } catch { /* no storage */ }
  return !last || Date.now() - last > AWAY_MS ? 'lights' : 'wave'
}

/**
 * lights: five start lights come on in sequence (at least ~1.6 s, so the fan sees it), go out, the app shows.
 * wave: the team's radio wave moves until the data is in, then the app shows at once.
 * Either way, if the pit wall doesn't answer, a short message and a Try again button.
 */
export default function Splash({ team, mode, ready, failed = false, onDone }) {
  const [lit, setLit] = useState(0)
  const [phase, setPhase] = useState('loading') // loading | out | leave | holding
  const [slow, setSlow] = useState(false)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), HOLD_AFTER_MS)
    return () => clearTimeout(t)
  }, [])

  // lights: one more every LIGHT_MS until all five are on
  useEffect(() => {
    if (mode !== 'lights' || phase !== 'loading' || lit >= 5) return undefined
    const t = setTimeout(() => setLit((n) => n + 1), LIGHT_MS)
    return () => clearTimeout(t)
  }, [mode, lit, phase])

  useEffect(() => {
    const canFinish = mode === 'wave' || lit >= 5
    if (ready && (phase === 'loading' || phase === 'holding')) {
      if (reducedMotion()) { done.current?.(); return }
      if (mode === 'wave') setPhase('leave')
      else if (canFinish) setPhase('out')
      else if (phase === 'holding') setLit(5)
    } else if (!ready && phase === 'loading' && (failed || (slow && canFinish))) {
      if (mode === 'lights') setLit(5)
      setPhase('holding')
    }
  }, [ready, failed, slow, lit, phase, mode])

  useEffect(() => {
    if (phase === 'out') {
      const t = setTimeout(() => setPhase('leave'), OUT_MS)
      return () => clearTimeout(t)
    }
    if (phase === 'leave') {
      const t = setTimeout(() => { rememberSeen(); done.current?.() }, LEAVE_MS)
      return () => clearTimeout(t)
    }
    return undefined
  }, [phase])

  const style = team ? { ...teamStyle(team), '--lit': team.accent } : { '--lit': NEUTRAL, '--accent': NEUTRAL }
  const on = (i) => phase !== 'out' && phase !== 'leave' && i < lit

  return (
    <div className={`splash ${phase === 'leave' ? 'is-leaving' : ''} ${team ? '' : 'is-neutral'}`} style={style}
         role="status" aria-live="polite">
      {/* three rows: lights or wave sit in the middle row, at the centre of the screen; the message below never moves them */}
      <div className="splash-top">
        <Headset size={64} strokeWidth={1.8} />
        <div className="splash-brand">
          <div className="splash-name">RACE ENGENEer</div>
          <div className="app-sub">PERSONAL PIT WALL</div>
        </div>
        <div className="livery-stripe splash-stripe" aria-hidden="true"><span /><span /></div>
      </div>
      <div className="splash-middle" aria-hidden="true">
        {mode === 'lights' ? (
          <div className="start-lights">
            {[0, 1, 2, 3, 4].map((i) => <span key={i} className={`start-light ${on(i) ? 'is-on' : ''}`} />)}
          </div>
        ) : (
          <div className={`splash-wave ${phase === 'holding' ? '' : 'is-on'}`}>
            {BARS.map((h, i) => <span key={i} style={{ height: h, animationDelay: `${(i % 5) * 0.09}s` }} />)}
          </div>
        )}
      </div>
      <div className="splash-bottom">
        {phase === 'holding' && (
          <>
            <p className="splash-hold">Can't reach the pit wall. Check your connection.</p>
            <button type="button" className="btn-primary splash-retry" onClick={() => location.reload()}>Try again</button>
          </>
        )}
      </div>
    </div>
  )
}
