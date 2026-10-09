import { useCallback, useEffect, useRef, useState } from 'react'
import { useRadio } from '../useRadio.js'
import { messageKey, useNewMessage } from '../useNewMessage.js'
import NotificationsCard from '../NotificationsCard.jsx'
import ProofCard from '../ProofCard.jsx'
import RaceWeekendBand from '../RaceWeekendBand.jsx'
import TodayChecklist from '../TodayChecklist.jsx'
import { phaseInfo } from '../phases.js'

const GLOW_MS = 4000

// Only these phases ask the fan to do something; Grid, Finish Line and a pit stop don't.
const ACTION_PHASES = ['SPRINT_RACE', 'GRAND_PRIX', 'FINAL_LAP']

export default function Home({ team, crewId, onPractice }) {
  const { radio, offline, reload } = useRadio(crewId)
  const racing = !!radio && ACTION_PHASES.includes(radio.phase) && !radio.pitStop
  // the briefing (go vote) stays in the feed, right above the proof card; while racing the proof line moves to the checklist
  const feed = (radio?.messages ?? []).filter((m) =>
    (m.kind !== 'BRIEFING' || racing) && !(racing && m.kind === 'PROOF'))
  const todayLine = racing ? (radio.messages.find((m) => m.kind === 'PROOF')?.text ?? null) : null
  const { isNew, dismiss } = useNewMessage(crewId, radio ? feed : undefined)
  const boardGlow = useBoardGlow(crewId, racing ? `${radio.phase}|${radio.proof?.categories.map((c) => c.id).join(',')}` : null)
  const phase = radio ? phaseInfo(radio.phase) : null
  const [highlight, setHighlight] = useState(false)
  const timer = useRef(null)
  const handledLink = useRef(false)

  const goToProof = useCallback(() => {
    document.getElementById('proof-card')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    setHighlight(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setHighlight(false), 2400)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  // a notification can ask for the proof card: through the link (app was closed) or a message (app was open)
  useEffect(() => {
    if (radio && !handledLink.current && new URLSearchParams(window.location.search).get('proof') === '1') {
      handledLink.current = true
      window.history.replaceState(null, '', window.location.pathname)
      setTimeout(goToProof, 0)
    }
  }, [radio, goToProof])

  useEffect(() => {
    const worker = navigator.serviceWorker
    if (!worker?.addEventListener) return undefined
    const onMessage = (e) => { if (e.data?.type === 'proof') goToProof() }
    worker.addEventListener('message', onMessage)
    return () => worker.removeEventListener('message', onMessage)
  }, [goToProof])

  return (
    <div className={`screen home ${racing ? 'has-dock' : ''}`} style={{ '--accent': team.accent }}>
      <header className="home-head">
        <div>
          <div className="eyebrow">RACE ENGINEER</div>
          <div className="team-name">Team {team.member}</div>
        </div>
        {phase && <span className="phase-pill">{phase.label.toUpperCase()}</span>}
      </header>

      {offline && (
        <div className="offline-row" role="status">
          Can't reach the pit wall. Showing the last known state.
        </div>
      )}

      {phase && (
        <div className="status-row">
          <span>{phase.blurb}</span>
          <span className="tags">
            {radio.practice && <span className="pit-tag">FREE PRACTICE</span>}
            {radio.pitStop && <span className="pit-tag">PIT STOP</span>}
          </span>
        </div>
      )}

      <RaceWeekendBand team={team} />

      <main className="feed">
        <button type="button" className="btn-secondary" onClick={onPractice}>Try guided Free Practice</button>
        <article className="radio">
          <div className="radio-label">RADIO · ENGINEER</div>
          <p className="radio-text">"{team.welcome}"</p>
        </article>

        <NotificationsCard crewId={crewId} />

        {feed.map((m) => {
          const key = messageKey(m)
          const fresh = isNew(key)
          return (
            <article className={`radio ${fresh ? 'is-new' : ''}`} key={key} onClick={fresh ? dismiss : undefined}>
              <div className="radio-head">
                <div className={`radio-label ${m.from === 'RACE_CONTROL' ? 'is-control' : ''}`}>
                  {m.from === 'RACE_CONTROL' ? 'RADIO · RACE CONTROL' : 'RADIO · ENGINEER'}
                </div>
                {fresh && (
                  <span className="new-chip">
                    <span aria-hidden="true">● </span>NEW<span className="sr-only"> message</span>
                  </span>
                )}
              </div>
              <div className="radio-body">
                <p className="radio-text">"{m.text}"</p>
                {m.kind === 'BRIEFING' && radio.voteUrl && (
                  <div className="msg-actions">
                    <a className="btn-action" href={radio.voteUrl} target="_blank" rel="noopener noreferrer">Open MNET+</a>
                  </div>
                )}
              </div>
            </article>
          )
        })}

        {radio && <div hidden={!racing}>
          <ProofCard crewId={crewId} proof={radio.proof} onChanged={reload} highlight={highlight || boardGlow} />
        </div>}
      </main>

      {racing && <TodayChecklist radio={radio} line={todayLine} onProof={goToProof} glow={boardGlow} />}
    </div>
  )
}


/**
 * True for a few seconds when the proof card and the checklist show up for something new: a race phase starting, or
 * a new set of categories. Remembered per fan, so it plays once, also when the app was closed at the time.
 */
function useBoardGlow(crewId, board) {
  const [glow, setGlow] = useState(false)
  useEffect(() => {
    const key = `e1.board.${crewId}`
    if (!board) {
      // nothing to do right now (Grid, pit stop, Finish Line): forget, so the board glows again when it comes back
      try { localStorage.removeItem(key) } catch { /* no storage */ }
      return undefined
    }
    let last = null
    try { last = localStorage.getItem(key) } catch { /* no storage */ }
    if (last === board) return undefined
    try { localStorage.setItem(key, board) } catch { /* no storage */ }
    setGlow(true)
    const t = setTimeout(() => setGlow(false), GLOW_MS)
    return () => clearTimeout(t)
  }, [crewId, board])
  return glow
}
