import { useCallback, useEffect, useRef, useState } from 'react'
import { useRadio } from '../useRadio.js'
import { messageKey, useNewMessage } from '../useNewMessage.js'
import NotificationsCard from '../NotificationsCard.jsx'
import ProofCard from '../ProofCard.jsx'
import { phaseInfo } from '../phases.js'

export default function Home({ team, crewId }) {
  const { radio, offline, reload } = useRadio(crewId)
  const { newKey, dismiss } = useNewMessage(crewId, radio?.messages)
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
    <div className="screen home" style={{ '--accent': team.accent }}>
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

      <main className="feed">
        <article className="radio">
          <div className="radio-label">RADIO · ENGINEER</div>
          <p className="radio-text">"{team.welcome}"</p>
        </article>

        <NotificationsCard crewId={crewId} />

        {radio?.messages.map((m) => {
          const key = messageKey(m)
          const isNew = key === newKey
          return (
            <article className={`radio ${isNew ? 'is-new' : ''}`} key={key} onClick={isNew ? dismiss : undefined}>
              <div className="radio-head">
                <div className={`radio-label ${m.from === 'RACE_CONTROL' ? 'is-control' : ''}`}>
                  {m.from === 'RACE_CONTROL' ? 'RADIO · RACE CONTROL' : 'RADIO · ENGINEER'}
                </div>
                {isNew && (
                  <span className="new-chip">
                    <span aria-hidden="true">● </span>NEW<span className="sr-only"> message</span>
                  </span>
                )}
              </div>
              <p className="radio-text">"{m.text}"</p>
              {m.kind === 'BRIEFING' && (
                <div className="msg-actions">
                  {radio.voteUrl && (
                    <a className="btn-action" href={radio.voteUrl} target="_blank" rel="noopener noreferrer">Open MNET+</a>
                  )}
                  <button type="button" className="btn-action" onClick={goToProof}>Upload proof</button>
                </div>
              )}
            </article>
          )
        })}

        <ProofCard crewId={crewId} proof={radio?.proof} onChanged={reload} highlight={highlight} />
      </main>
    </div>
  )
}
