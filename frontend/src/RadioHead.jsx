import { Headset } from './RaceHeader.jsx'

const BARS = [8, 14, 20, 12, 22, 12, 8]
const DELAYS = [0, 0.1, 0.2, 0.3, 0.15, 0.25, 0.05]

/** "JUST NOW", "12 MIN AGO", "3H AGO", "YESTERDAY", "4 DAYS AGO". */
export function ago(iso, now = Date.now()) {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return null
  const min = Math.floor((now - t) / 60000)
  if (min < 2) return 'JUST NOW'
  if (min < 60) return `${min} MIN AGO`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}H AGO`
  const d = Math.floor(h / 24)
  return d === 1 ? 'YESTERDAY' : `${d} DAYS AGO`
}

/**
 * Tab with the headset, then the radio wave (moving while the message is new) and how long ago it came in.
 * What Race Control sends a team from the Paddock reaches the fan through their engineer: a written message reads
 * RADIO · ENGINEER, the team's chant RADIO · FANCHANT.
 */
export default function RadioHead({ from = 'ENGINEER', kind = null, fresh = false, at = null, now }) {
  const when = at ? ago(at, now) : null
  const control = from === 'RACE_CONTROL'
  const label = control ? 'RADIO · RACE CONTROL' : kind === 'CHANT' ? 'RADIO · FANCHANT' : 'RADIO · ENGENEer'
  return (
    <div className="radio-head">
      <div className={`radio-label ${control ? 'is-control' : ''}`}>
        <Headset size={16} strokeWidth={2.4} />
        {label}
      </div>
      <div className="radio-meta">
        <span className={`wave ${fresh ? 'is-on' : ''} ${control ? 'is-control' : ''}`} aria-hidden="true">
          {BARS.map((h, i) => (
            <span key={i} className="wave-bar" style={{ height: fresh ? h : Math.ceil(h * 0.6), animationDelay: `${DELAYS[i]}s` }} />
          ))}
        </span>
        {fresh && <span className="sr-only">New message.</span>}
        {when && <span className={`radio-when ${fresh ? 'is-fresh' : ''}`}>{when}</span>}
      </div>
    </div>
  )
}
