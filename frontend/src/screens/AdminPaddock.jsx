import { useEffect, useState } from 'react'
import { adminPaddock, deletePaddock, putChant, sendPaddock } from '../api.js'
import { TEAMS, teamBySlug, teamStyle } from '../teams.js'
import { ago } from '../RadioHead.jsx'

const MAX_CHANT = 300
const MAX_MESSAGE = 500

/** Paddock Announcers: pick a team, send its fanchant or a message. Only that team's crew gets it. */
export default function PaddockPanel({ auth, onLogout }) {
  const [slug, setSlug] = useState(TEAMS[0].slug)
  const [chants, setChants] = useState(null)
  const [chant, setChant] = useState('')
  const [message, setMessage] = useState('')
  const [recent, setRecent] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)

  const team = teamBySlug(slug)
  const saved = chants?.[slug] ?? ''
  const fail = (err, fallback) => {
    if (err.status === 401) { onLogout(); return }
    setError(err.status === 400 ? 'Too long, or empty.' : err.status === 409 ? 'Save the chant first.' : fallback)
  }

  const load = () => adminPaddock(auth)
    .then((r) => { setChants(r.chants); setRecent(r.recent) })
    .catch((err) => fail(err, "Can't load the paddock."))

  useEffect(() => { load() }, [])
  useEffect(() => { setChant(chants?.[slug] ?? ''); setError(null); setDone(null) }, [slug, chants])

  const run = async (work, success) => {
    setBusy(true); setError(null); setDone(null)
    try {
      await work()
      setDone(success)
      await load()
    } catch (err) {
      fail(err, "Couldn't do that. Try again.")
    } finally {
      setBusy(false)
    }
  }

  const saveChant = () => run(() => putChant(auth, slug, chant.trim()), 'Chant saved.')
  const sendChant = () => {
    if (!window.confirm(`Send Team ${team.member}'s fanchant to its crew now?`)) return
    run(() => sendPaddock(auth, slug, { kind: 'CHANT' }), `Fanchant sent to Team ${team.member}.`)
  }
  const sendMessage = () => {
    if (!window.confirm(`Send this message to Team ${team.member} only?`)) return
    run(async () => { await sendPaddock(auth, slug, { kind: 'MESSAGE', text: message.trim() }); setMessage('') },
      `Message sent to Team ${team.member}.`)
  }
  const remove = (m) => {
    if (!window.confirm('Remove this announcement from the team feed? Notifications already delivered stay on phones.')) return
    run(() => deletePaddock(auth, m.id), 'Announcement removed.')
  }

  const mine = recent.filter((m) => m.team === slug)
  const chantChanged = chant.trim() !== saved

  return (
    <div className="admin-body" style={teamStyle(team)}>
      <section className="card">
        <div className="eyebrow">PADDOCK ANNOUNCERS</div>
        <p className="muted small">
          Talk to one team at a time, through its race ENGENEer. Only that team's crew gets it: in their feed as
          RADIO · ENGENEer (or RADIO · FANCHANT), and as a notification. Each fan sees it until the next time they
          open the app after reading it, for 48 hours at most.
        </p>
        <div className="team-picker" role="radiogroup" aria-label="Team">
          {TEAMS.map((t) => (
            <button key={t.slug} type="button" role="radio" aria-checked={t.slug === slug}
                    className={`team-pick ${t.slug === slug ? 'is-picked' : ''}`} style={teamStyle(t)}
                    onClick={() => setSlug(t.slug)}>
              <span className="team-badge small">{t.badge}</span>
              <span>{t.member}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="eyebrow">TEAM {team.member.toUpperCase()} · FANCHANT</div>
        <textarea className="textarea" rows={3} maxLength={MAX_CHANT} aria-label={`Team ${team.member} fanchant`}
                  placeholder="Write the team's fanchant once, then send it whenever the crew needs a boost."
                  value={chant} disabled={chants === null}
                  onChange={(e) => { setChant(e.target.value); setDone(null) }} />
        <div className="proof-actions">
          <button className="btn-secondary" disabled={busy || !chantChanged} onClick={saveChant}>Save chant</button>
          <button className="btn-primary" disabled={busy || !saved || chantChanged} onClick={sendChant}>
            Send fanchant
          </button>
        </div>
        {chantChanged && saved && <p className="muted small">Save the changes before sending.</p>}
      </section>

      <section className="card">
        <div className="eyebrow">MESSAGE TO TEAM {team.member.toUpperCase()}</div>
        <textarea className="textarea" rows={4} maxLength={MAX_MESSAGE} aria-label={`Message to Team ${team.member}`}
                  placeholder="News, a shout-out, an instruction only this team needs."
                  value={message} onChange={(e) => { setMessage(e.target.value); setDone(null) }} />
        <div className="row-between">
          <span className="muted small">{message.trim().length} / {MAX_MESSAGE}</span>
          <button className="btn-primary btn-inline" disabled={busy || !message.trim()} onClick={sendMessage}>
            Send to Team {team.member}
          </button>
        </div>
      </section>

      {done && <p className="muted small" role="status">{done}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      <section className="card">
        <div className="eyebrow">SENT TO TEAM {team.member.toUpperCase()}</div>
        {mine.length === 0 && <p className="muted small">Nothing sent yet.</p>}
        {mine.map((m) => (
          <div key={m.id} className="event-admin">
            <div className="event-head">
              <span className="pit-tag">{m.kind === 'CHANT' ? 'FANCHANT' : 'MESSAGE'}</span>
              <span className="muted small">{ago(m.at)}</span>
            </div>
            <span className="small">{m.text}</span>
            <div className="proof-actions">
              <button type="button" className="btn-secondary" disabled={busy} onClick={() => remove(m)}>Remove</button>
            </div>
          </div>
        ))}
      </section>

      <button type="button" className="btn-link" onClick={onLogout}>Log out</button>
    </div>
  )
}
