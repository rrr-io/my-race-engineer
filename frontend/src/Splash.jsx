import { useEffect, useRef, useState } from 'react'
import { Headset } from './RaceHeader.jsx'
import { teamStyle } from './teams.js'

const STEP_MS = 400        // one light every 0.4 s while loading
const FAST_MS = 50         // remaining lights once the data is in
const OUT_MS = 450         // "lights out" on screen
const LEAVE_MS = 250       // fade to the app
const HOLD_AFTER_MS = 8000 // then "holding on the grid"
const NEUTRAL_LIT = '#E10600'

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/**
 * Five start lights fill while the app loads; when it is ready they go out and the app shows. No fixed duration:
 * a fast load is a short flash. team is the fan's team if we know it (returning fan), else null (neutral red).
 */
export default function Splash({ team, ready, failed = false, onDone }) {
  const [lit, setLit] = useState(0)
  const [phase, setPhase] = useState('loading') // loading | out | leave | holding
  const [slow, setSlow] = useState(false)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), HOLD_AFTER_MS)
    return () => clearTimeout(t)
  }, [])

  // fill the lights: slowly while waiting, fast once ready
  useEffect(() => {
    if (phase !== 'loading' || lit >= 5) return undefined
    const t = setTimeout(() => setLit((n) => n + 1), ready ? FAST_MS : STEP_MS)
    return () => clearTimeout(t)
  }, [lit, ready, phase])

  useEffect(() => {
    if (ready && (phase === 'loading' || phase === 'holding')) {
      if (reducedMotion()) { done.current?.(); return }
      if (lit >= 5) setPhase('out')
      else if (phase === 'holding') setLit(5)
    } else if (!ready && phase === 'loading' && (failed || (slow && lit >= 5))) {
      setLit(5)
      setPhase('holding')
    }
  }, [ready, failed, slow, lit, phase])

  useEffect(() => {
    if (phase === 'out') {
      const t = setTimeout(() => setPhase('leave'), OUT_MS)
      return () => clearTimeout(t)
    }
    if (phase === 'leave') {
      const t = setTimeout(() => done.current?.(), LEAVE_MS)
      return () => clearTimeout(t)
    }
    return undefined
  }, [phase])

  const style = team ? { ...teamStyle(team), '--lit': team.accent } : { '--lit': NEUTRAL_LIT }
  const on = (i) => phase !== 'out' && phase !== 'leave' && i < lit

  return (
    <div className={`splash ${phase === 'leave' ? 'is-leaving' : ''} ${team ? '' : 'is-neutral'}`} style={style}
         role="status" aria-live="polite">
      {/* three rows: the lights sit in the middle row, always at the centre of the screen; what changes below
          (caption, lights out, holding) grows downwards and never moves them */}
      <div className="splash-top">
        <Headset size={64} strokeWidth={1.8} />
        <div className="splash-brand">
          <div className="splash-name">RACE ENGENEer</div>
          <div className="app-sub">PERSONAL PIT WALL</div>
        </div>
        <div className="livery-stripe splash-stripe" aria-hidden="true"><span /><span /></div>
      </div>
      <div className="start-lights" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => <span key={i} className={`start-light ${on(i) ? 'is-on' : ''}`} />)}
      </div>
      <div className="splash-bottom">

      {(phase === 'loading') && (
        <div className="splash-caption">
          {team ? `TEAM ${team.member.toUpperCase()} · ${team.livery.toUpperCase()}` : 'CONNECTING TO THE PIT WALL'}
        </div>
      )}
      {(phase === 'out' || phase === 'leave') && (
        <div className="splash-out">
          <div className="splash-out-title">LIGHTS OUT</div>
          <div className="splash-caption">AND AWAY WE GO</div>
        </div>
      )}
      {phase === 'holding' && (
        <>
          <div className="splash-hold">
            <div className="splash-hold-title">HOLDING ON THE GRID</div>
            <p>Can't reach the pit wall. Check your connection.</p>
          </div>
          <button type="button" className="btn-primary splash-retry" onClick={() => location.reload()}>Try again</button>
        </>
      )}
      </div>
    </div>
  )
}
