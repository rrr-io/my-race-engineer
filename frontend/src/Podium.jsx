import { useEffect, useState } from 'react'
import { teamBySlug, teamStyle } from './teams.js'

// left to right on the podium: P2, P1, P3
const STAGE_ORDER = [2, 1, 3]

const proofsText = (n) => `${n} ${n === 1 ? 'proof' : 'proofs'}`

function Step({ standing, mine }) {
  const team = teamBySlug(standing.team)
  return (
    <div className={`podium-col is-p${standing.position} ${mine ? 'is-mine' : ''}`} style={teamStyle(team)}>
      <div className="podium-team">
        {mine && <span className="podium-mine">YOUR TEAM</span>}
        <div className="team-badge">{team.badge}</div>
        <div className="podium-name">TEAM {team.member.toUpperCase()}</div>
        <div className="podium-livery">{team.livery.toUpperCase()}</div>
        <div className="podium-count">{proofsText(standing.proofs)}</div>
      </div>
      <div className="podium-step"><span>{standing.position}</span></div>
    </div>
  )
}

/** The Podium Ceremony: steps rise P3, P2, P1, then the teams land on them. */
export function PodiumCeremony({ podium, myTeam, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const byPosition = Object.fromEntries(podium.map((s) => [s.position, s]))
  const winner = teamBySlug(podium[0].team)
  return (
    <div className="ceremony" role="dialog" aria-modal="true" aria-labelledby="ceremony-title">
      <div className="chequer" aria-hidden="true" />
      <div className="ceremony-head">
        <div className="eyebrow">FINISH LINE · CHEQUERED FLAG</div>
        <h1 id="ceremony-title">Podium Ceremony</h1>
        <p className="ceremony-p1" style={teamStyle(winner)}>P1 · Team {winner.member}</p>
      </div>
      <div className="podium">
        {STAGE_ORDER.filter((p) => byPosition[p]).map((p) => (
          <Step key={p} standing={byPosition[p]} mine={byPosition[p].team === myTeam} />
        ))}
      </div>
      <p className="ceremony-note">Teams ranked by approved proofs across every phase. Thank you, crew!</p>
      <button type="button" className="btn-primary ceremony-close" onClick={onClose}>Back to the pit wall</button>
    </div>
  )
}

/** The Podium at the Finish Line, in the feed, with a replay of the ceremony. */
export function PodiumCard({ podium, myTeam, onReplay }) {
  return (
    <section className="card podium-card" aria-labelledby="podium-title">
      <div className="proof-title">
        <div className="eyebrow" id="podium-title">PODIUM</div>
        <span className="pit-tag">FINAL</span>
      </div>
      <ol className="podium-list">
        {podium.map((s) => {
          const team = teamBySlug(s.team)
          return (
            <li key={s.team} className={s.team === myTeam ? 'is-mine' : ''} style={teamStyle(team)}>
              <span className="podium-pos">P{s.position}</span>
              <span className="team-badge small">{team.badge}</span>
              <span className="podium-row-text">
                <b>Team {team.member}</b>
                <span className="muted small">{team.livery}</span>
              </span>
              <span className="podium-row-count">{proofsText(s.proofs)}</span>
            </li>
          )
        })}
      </ol>
      <button type="button" className="btn-secondary" onClick={onReplay}>Replay the ceremony</button>
    </section>
  )
}

/** Plays the ceremony once per podium per fan (also if the app was closed when the race ended). */
export function useCeremony(crewId, podium) {
  const signature = podium?.length ? podium.map((s) => `${s.team}:${s.proofs}`).join(',') : null
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!signature) return
    const key = `e1.podium.${crewId}`
    let seen = null
    try { seen = localStorage.getItem(key) } catch { /* no storage */ }
    if (seen === signature) return
    try { localStorage.setItem(key, signature) } catch { /* no storage */ }
    setOpen(true)
  }, [crewId, signature])
  return { open: open && !!signature, show: () => setOpen(true), close: () => setOpen(false) }
}
