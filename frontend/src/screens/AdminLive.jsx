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
      ? `${devicesText(preview.devices)} get this radio call now${preview.from === 'ENGINEER' ? ", each in their ENGENEer's voice" : ''}:`
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

/**
 * On/off switch for the two states that sit on top of the phase (pit stop, free practice), so they don't read like
 * the one-off actions around them. Flipping it opens the check card; the switch moves only once the change is saved.
 */
function Toggle({ id, kind, label, on, onLabel, disabled, onToggle }) {
  return (
    <div className="toggle-row">
      <label className="toggle-text" htmlFor={id}>
        <span className="eyebrow">{label}</span>
        <span className={`toggle-state ${on ? `is-on is-${kind}` : ''}`}>{on ? onLabel : 'OFF'}</span>
      </label>
      <button id={id} type="button" role="switch" aria-checked={on} disabled={disabled} onClick={onToggle}
              className={`switch is-${kind} ${on ? 'is-on' : ''}`}>
        <span className="switch-knob" aria-hidden="true" />
      </button>
    </div>
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
      if (err.status === 409) {
        setError(race.practice ? 'End free practice first.' : race.pitStop ? 'End the pit stop before changing stage.'
          : "That change isn't allowed right now.")
        load(); return
      }
      setError("Couldn't save. Try again.")
    } finally {
      setBusy(false)
    }
  }

  if (!race) return <p className="admin-body muted">{error ?? 'Loading…'}</p>

  const frozen = race.pitStop
  // free practice is a session on the Grid: phases and pit stops wait until it ends
  const locked = frozen || race.practice
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
  const askPractice = () => ask(race.practice
    ? { key: 'practice-off', where: 'practice', body: { practice: false }, title: 'End free practice?',
        effect: 'Uploads close and the race stays on the Grid. Practice proofs never count for the race or the podium.',
        yesLabel: 'End free practice' }
    : { key: 'practice-on', where: 'practice', body: { practice: true }, query: { practice: true },
        title: 'Start free practice?',
        effect: 'Fans can send a certificate from an old vote and you review it in Proofs, like on race day. Nothing counts. Phases and pit stops are locked until you end it.',
        yesLabel: 'Start free practice' })

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
        {race.practice && <p className="muted small">Free practice is on. End it to start a race phase.</p>}
        <div className="phase-list" role="radiogroup" aria-label="Race phase">
          {PHASES.map((p) => (
            <button key={p.key} type="button" role="radio" aria-checked={picked === p.key} disabled={locked || busy}
                    className={`phase-option ${picked === p.key ? 'is-picked' : ''}`}
                    onClick={() => { setPicked(p.key); if (confirm?.where === 'phase') setConfirm(null) }}>
              <span>{p.label}</span>
              <span className="muted small">{p.blurb}</span>
            </button>
          ))}
        </div>
        {confirm?.where !== 'phase' && (
          <button className="btn-primary" disabled={busy || locked || picked === race.phase} onClick={askPhase}>
            Set phase
          </button>
        )}
      </section>
      {confirmCard('phase')}

      <section className="card">
        <Toggle id="pit-switch" kind="pit" label="PIT STOP" on={race.pitStop} onLabel="ON · RACE PAUSED"
                disabled={busy || confirm?.where === 'pit' || (race.practice && !race.pitStop)} onToggle={askPit} />
        <p className="muted small">Pauses the race for everyone and posts a Race Control message in the app.</p>
        {race.practice && !race.pitStop && <p className="muted small">No pit stop during free practice.</p>}
      </section>
      {confirmCard('pit')}

      <section className="card">
        <Toggle id="practice-switch" kind="practice" label="FREE PRACTICE" on={race.practice} onLabel="ON · NOT COUNTED"
                disabled={busy || frozen || confirm?.where === 'practice' || (!race.practice && race.phase !== 'GRID')}
                onToggle={askPractice} />
        <p className="muted small">
          A session on the Grid to try the real loop: fans send a certificate from an old vote, you approve or reject it
          in Proofs. Practice proofs never count for the race or the podium.
        </p>
        {frozen && <p className="muted small">Pit stop is on. End it to switch free practice.</p>}
        {!race.practice && race.phase !== 'GRID' && !frozen && (
          <p className="muted small">Free practice starts from the Grid. Set the phase to Grid first.</p>
        )}
      </section>
      {confirmCard('practice')}

      {error && <p className="error" role="alert">{error}</p>}
      <button type="button" className="btn-link" onClick={onLogout}>Log out</button>
    </div>
  )
}
