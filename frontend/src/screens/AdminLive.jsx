import { useEffect, useState } from 'react'
import { getRace, previewRace, setRace } from '../api.js'
import { PHASES, phaseInfo } from '../phases.js'
import { teamBySlug } from '../teams.js'

const devicesText = (n) => `${n} device${n === 1 ? '' : 's'}`

/** Tells Race Control exactly what a change sends before it goes out. */
function ConfirmCard({ confirm, busy, onYes, onNo }) {
  const { title, effect, preview, failed, yesLabel } = confirm
  const lines = preview?.lines ?? []
  let reach = null
  if (preview && lines.length > 0) {
    reach = preview.pushEnabled
      ? `${devicesText(preview.devices)} get this radio call now${preview.from === 'ENGINEER' ? ", each in their engineer's voice" : ''}:`
      : 'Push is off: fans see this in the app only.'
  } else if (preview) {
    reach = 'No radio call goes out for this. Fans see the change in the app.'
  }

  return (
    <section className="card confirm" role="alertdialog" aria-labelledby="confirm-title">
      <div className="eyebrow">CHECK BEFORE SENDING</div>
      <div className="confirm-title" id="confirm-title">{title}</div>
      {effect && <p className="small">{effect}</p>}
      {!preview && !failed && <p className="muted small">Loading what fans will get…</p>}
      {failed && <p className="muted small">Couldn't load the preview. You can still confirm.</p>}
      {reach && <p className="muted small">{reach}</p>}
      {lines.length > 0 && (
        <ul className="preview-list">
          {lines.map((l) => (
            <li key={l.team ?? 'all'}>
              <span className="preview-team">{l.team ? `Team ${teamBySlug(l.team)?.member ?? l.team}` : 'Race Control · everyone'}</span>
              <span className="small">"{l.text}"</span>
            </li>
          ))}
        </ul>
      )}
      <div className="proof-actions">
        <button type="button" className="btn-primary" disabled={busy || (!preview && !failed)} onClick={onYes}>{yesLabel}</button>
        <button type="button" className="btn-secondary" disabled={busy} onClick={onNo}>Cancel</button>
      </div>
    </section>
  )
}

/** The race as it happens: phase, free practice, pit stop. Every change is confirmed with a preview. */
export default function LivePanel({ auth, onLogout }) {
  const [race, setRaceState] = useState(null)
  const [picked, setPicked] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const load = () => getRace()
    .then((r) => { setRaceState(r); setPicked(r.phase) })
    .catch(() => setError("Can't load the race state."))

  useEffect(() => { load() }, [])

  // opens the check card; the preview (if any) loads into it
  const ask = (next) => {
    setError(null)
    setConfirm({ ...next, preview: next.query ? null : { lines: [] }, failed: false })
    if (!next.query) return
    previewRace(auth, next.query)
      .then((preview) => setConfirm((c) => (c && c.key === next.key ? { ...c, preview } : c)))
      .catch((err) => {
        if (err.status === 401) { onLogout(); return }
        setConfirm((c) => (c && c.key === next.key ? { ...c, failed: true } : c))
      })
  }

  const apply = async (body) => {
    setBusy(true); setError(null)
    try {
      const r = await setRace(auth, body)
      setRaceState(r); setPicked(r.phase); setConfirm(null)
    } catch (err) {
      if (err.status === 401) { onLogout(); return }
      setConfirm(null)
      if (err.status === 409) { setError('End the pit stop before changing stage.'); load(); return }
      setError("Couldn't save. Try again.")
    } finally {
      setBusy(false)
    }
  }

  if (!race) return <p className="admin-body muted">{error ?? 'Loading…'}</p>

  const frozen = race.pitStop
  const confirmCard = (where) => confirm?.where === where && (
    <ConfirmCard confirm={confirm} busy={busy} onYes={() => apply(confirm.body)} onNo={() => setConfirm(null)} />
  )

  const askPhase = () => ask({
    key: `phase-${picked}`, where: 'phase', body: { phase: picked }, query: { phase: picked },
    title: `Switch to ${phaseInfo(picked).label}?`, effect: phaseInfo(picked).blurb + '.', yesLabel: 'Set phase'
  })
  const askPit = () => ask(race.pitStop
    ? { key: 'pit-off', where: 'pit', body: { pitStop: false }, title: 'End the pit stop?',
        effect: 'The race resumes and reminders start again.', yesLabel: 'End pit stop' }
    : { key: 'pit-on', where: 'pit', body: { pitStop: true }, query: { pitStop: true }, title: 'Start a pit stop?',
        effect: 'The race pauses for everyone: the stage is frozen and reminders stop.', yesLabel: 'Start pit stop' })
  const askPractice = () => ask({
    key: `practice-${!race.practice}`, where: 'practice', body: { practice: !race.practice },
    title: race.practice ? 'End free practice?' : 'Start free practice?',
    effect: 'The phase goes back to Grid for everyone.', yesLabel: race.practice ? 'End free practice' : 'Start free practice'
  })

  return (
    <div className="admin-body">
      <section className="card">
        <div className="eyebrow">CURRENT PHASE</div>
        <div className="admin-current">
          {phaseInfo(race.phase).label}
          {race.practice && <span className="pit-tag">FREE PRACTICE</span>}
          {race.pitStop && <span className="pit-tag">PIT STOP</span>}
        </div>
      </section>

      <section className="card">
        <div className="eyebrow">SET PHASE</div>
        {frozen && <p className="muted small">Pit stop is on. End it to change stage.</p>}
        <div className="phase-list" role="radiogroup" aria-label="Race phase">
          {PHASES.map((p) => (
            <button key={p.key} type="button" role="radio" aria-checked={picked === p.key} disabled={frozen || busy}
                    className={`phase-option ${picked === p.key ? 'is-picked' : ''}`}
                    onClick={() => { setPicked(p.key); if (confirm?.where === 'phase') setConfirm(null) }}>
              <span>{p.label}</span>
              <span className="muted small">{p.blurb}</span>
            </button>
          ))}
        </div>
        {confirm?.where !== 'phase' && (
          <button className="btn-primary" disabled={busy || frozen || picked === race.phase} onClick={askPhase}>
            Set phase
          </button>
        )}
      </section>
      {confirmCard('phase')}

      <section className="card">
        <div className="eyebrow">PIT STOP</div>
        <p className="muted small">Pauses the race for everyone and posts a Race Control message in the app.</p>
        <button className="btn-secondary" disabled={busy || confirm?.where === 'pit'} onClick={askPit}>
          {race.pitStop ? 'End pit stop' : 'Start pit stop'}
        </button>
      </section>
      {confirmCard('pit')}

      <section className="card">
        <div className="eyebrow">FREE PRACTICE</div>
        {frozen && <p className="muted small">Pit stop is on. End it to switch free practice.</p>}
        <p className="muted small">Marks the race as a simulation. Switching it on or off resets the phase to Grid.</p>
        <button className="btn-secondary" disabled={busy || frozen || confirm?.where === 'practice'} onClick={askPractice}>
          {race.practice ? 'End free practice' : 'Start free practice'}
        </button>
      </section>
      {confirmCard('practice')}

      {error && <p className="error" role="alert">{error}</p>}
      <button type="button" className="btn-link" onClick={onLogout}>Log out</button>
    </div>
  )
}
