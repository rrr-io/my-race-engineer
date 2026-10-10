import { useCallback, useEffect, useRef, useState } from 'react'
import { useRadio } from '../useRadio.js'
import { messageKey, useNewMessage } from '../useNewMessage.js'
import NotificationsCard from '../NotificationsCard.jsx'
import ProofCard from '../ProofCard.jsx'
import RaceWeekendBand from '../RaceWeekendBand.jsx'
import TodayChecklist from '../TodayChecklist.jsx'
import RaceHeader from '../RaceHeader.jsx'
import RadioHead from '../RadioHead.jsx'
import { teamStyle } from '../teams.js'
import { useNow } from '../useNow.js'
import { PodiumCard, PodiumCeremony, useCeremony } from '../Podium.jsx'

const GLOW_MS = 8000

// Only these phases ask the fan to do something; Grid, Finish Line and a pit stop don't.
const ACTION_PHASES = ['SPRINT_RACE', 'GRAND_PRIX', 'FINAL_LAP']

export default function Home({ team, crewId, onReady }) {
  const { radio, offline, reload } = useRadio(crewId)
  useEffect(() => { if (radio || offline) onReady?.() }, [radio, offline, onReady])
  const racing = !!radio && ACTION_PHASES.includes(radio.phase) && !radio.pitStop
  // the briefing (go vote) stays in the feed, right above the proof card; while racing the proof line moves to the checklist
  const feed = (radio?.messages ?? []).filter((m) =>
    (m.kind !== 'BRIEFING' || racing) && !(racing && m.kind === 'PROOF'))
  const todayLine = racing ? (radio.messages.find((m) => m.kind === 'PROOF')?.text ?? null) : null
  const { isNew, dismiss } = useNewMessage(crewId, radio ? feed : undefined)
  const boardGlow = useBoardGlow(crewId, racing ? `${radio.phase}|${radio.proof?.categories.map((c) => c.id).join(',')}` : null)
  const now = useNow()
  const podium = radio?.phase === 'FINISH_LINE' ? (radio.podium ?? []) : []
  const ceremony = useCeremony(crewId, podium)
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
    <div className={`screen home ${racing ? 'has-dock' : ''}`} style={teamStyle(team)}>
      <RaceHeader team={team} radio={radio} />

      {offline && (
        <div className="offline-row" role="status">
          Can't reach the pit wall. Showing the last known state.
        </div>
      )}

      <RaceWeekendBand team={team} />

      <main className="feed">
        <article className="radio">
          <RadioHead />
          <div className="radio-body"><p className="radio-text">"{team.welcome}"</p></div>
        </article>

        <NotificationsCard crewId={crewId} />

        {feed.map((m) => {
          const key = messageKey(m)
          const fresh = isNew(key)
          return (
            <article className={`radio ${fresh ? 'is-new' : ''}`} key={key} onClick={fresh ? dismiss : undefined}>
              <RadioHead from={m.from} kind={m.kind} fresh={fresh} at={m.at} now={now} />
              <div className="radio-body">
                <p className={`radio-text ${m.kind === 'CHANT' ? 'is-chant' : ''}`}>
                  {m.kind === 'CHANT' ? m.text : `"${m.text}"`}
                </p>
                {m.kind === 'BRIEFING' && (
                  <div className="msg-actions">
                    {radio.voteUrl && (
                      <a className="btn-action" href={radio.voteUrl} target="_blank" rel="noopener noreferrer">Open MNET+</a>
                    )}
                    {racing && (
                      <button type="button" className="btn-action" onClick={(e) => { e.stopPropagation(); goToProof() }}>
                        Upload proof
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          )
        })}

        {podium.length > 0 && <PodiumCard podium={podium} myTeam={team.slug} onReplay={ceremony.show} />}

        {racing && <ProofCard crewId={crewId} proof={radio.proof} onChanged={reload} highlight={highlight || boardGlow} />}
      </main>

      {racing && <TodayChecklist radio={radio} line={todayLine} onProof={goToProof} glow={boardGlow} />}

      {ceremony.open && <PodiumCeremony podium={podium} myTeam={team.slug} onClose={ceremony.close} />}
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
