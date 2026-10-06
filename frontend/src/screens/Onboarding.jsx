import { useState } from 'react'
import { TEAMS } from '../teams.js'

export default function Onboarding({ onJoin }) {
  const [picked, setPicked] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const team = TEAMS.find((t) => t.slug === picked)

  const submit = async () => {
    setBusy(true); setError(null)
    try { await onJoin(picked) }
    catch { setError("Couldn't join the team. Check your connection and try again."); setBusy(false) }
  }

  return (
    <div className="screen onboarding" style={team ? { '--accent': team.accent } : undefined}>
      <header className="onb-head">
        <h1>Who are you racing for?</h1>
        <p className="muted">Pick your driver. You'll join their pit crew and get a race engineer who keeps you on track every day.</p>
      </header>

      <div className="driver-grid" role="radiogroup" aria-label="Drivers">
        {TEAMS.map((t) => (
          <button
            key={t.slug}
            type="button"
            role="radio"
            aria-checked={picked === t.slug}
            className={`driver ${picked === t.slug ? 'is-picked' : ''}`}
            style={{ '--team': t.accent }}
            onClick={() => setPicked(t.slug)}
          >
            <span className="driver-swatch" aria-hidden="true" />
            <span className="driver-name">{t.member}</span>
            <span className="driver-team">Team {t.member}</span>
          </button>
        ))}
      </div>

      <footer className="onb-foot">
        <p className="muted small">You can't switch teams once the race starts.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn-primary" disabled={!picked || busy} onClick={submit}>
          {team ? `Join Team ${team.member}` : 'Pick a driver'}
        </button>
      </footer>
    </div>
  )
}
