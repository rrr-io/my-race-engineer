import { useCallback, useEffect, useRef, useState } from 'react'
import { useRadio } from '../useRadio.js'
import { messageKey, useNewMessage } from '../useNewMessage.js'
import { usePaddockRead } from '../usePaddockRead.js'
import NotificationsCard from '../NotificationsCard.jsx'
import InstallCard from '../InstallCard.jsx'
import ProofCard from '../ProofCard.jsx'
import RaceWeekendBand from '../RaceWeekendBand.jsx'
import TodayChecklist from '../TodayChecklist.jsx'
import RaceHeader from '../RaceHeader.jsx'
import RadioHead from '../RadioHead.jsx'
import { teamStyle } from '../teams.js'
import { useNow } from '../useNow.js'
import { PodiumCard, PodiumCeremony, useCeremony } from '../Podium.jsx'
import { KARTS, practiceDone } from '../gokart.js'
import FormationLap, { formationLapDone } from '../FormationLap.jsx'

const GLOW_MS = 8000

// Only these phases ask the fan to do something; Grid, Finish Line and a pit stop don't. Free practice (on the Grid)
// opens the proof card too, for certificates from an old vote that Race Control reviews but never counts.
const ACTION_PHASES = ['SPRINT_RACE', 'GRAND_PRIX', 'FINAL_LAP']

export default function Home({ team, crewId, onReady, onPractice, tourReady = true }) {
  const { radio, offline, reload } = useRadio(crewId)
  useEffect(() => { if (radio || offline) onReady?.() }, [radio, offline, onReady])
  const practice = !!radio?.practice
  const racing = !!radio && (ACTION_PHASES.includes(radio.phase) || practice) && !radio.pitStop
  // in free practice there's nothing to vote: no MNET+ button anywhere
  const voteUrl = practice ? null : radio?.voteUrl
  // the briefing (go vote) stays in the feed, right above the proof card; while racing the proof line moves to the checklist
  // fanchants and Paddock messages already read on an earlier opening are gone, to keep the feed short
  const paddockRead = usePaddockRead(crewId, radio?.messages)
  const feed = (radio?.messages ?? []).filter((m) =>
    (m.kind !== 'BRIEFING' || racing) && !(racing && m.kind === 'PROOF') && !paddockRead.isHidden(m))
  const todayLine = racing ? (radio.messages.find((m) => m.kind === 'PROOF')?.text ?? null) : null
  const { isNew, dismiss } = useNewMessage(crewId, radio ? feed : undefined)
  const boardGlow = useBoardGlow(crewId, racing ? `${practice ? 'PRACTICE' : radio.phase}|${radio.proof?.categories.map((c) => c.id).join(',')}` : null)
  const now = useNow()
  const podium = radio?.phase === 'FINISH_LINE' ? (radio.podium ?? []) : []
  const ceremony = useCeremony(crewId, podium)
  const [highlight, setHighlight] = useState(false)
  // the Formation Lap: once, the first time the home is ready (after the splash, never over the podium ceremony)
  const [tour, setTour] = useState(() => !formationLapDone())
  const showTour = tour && tourReady && !!radio && !ceremony.open
  const endTour = useCallback(() => setTour(false), [])
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
      <RaceHeader team={team} radio={radio} onTour={() => setTour(true)} />

      {offline && (
        <div className="offline-row" role="status">
          Can't reach the pit wall. Showing the last known state.
        </div>
      )}

      <RaceWeekendBand team={team} />

      <main className="feed">
        <article className="radio" data-tour="radio">
          <RadioHead />
          <div className="radio-body"><p className="radio-text">"{team.welcome}"</p></div>
        </article>

        <NotificationsCard crewId={crewId} />

        <InstallCard />

        {feed.map((m) => {
          const key = messageKey(m)
          const fresh = isNew(key)
          return (
            <article className={`radio ${fresh ? 'is-new' : ''}`} key={key} onClick={fresh ? dismiss : undefined}
                     data-paddock-id={m.from === 'PADDOCK' && m.id != null ? m.id : undefined}>
              <RadioHead from={m.from} kind={m.kind} fresh={fresh} at={m.at} now={now} />
              <div className="radio-body">
                <p className={`radio-text ${m.kind === 'CHANT' ? 'is-chant' : ''}`}>
                  {m.kind === 'CHANT' ? m.text : `"${m.text}"`}
                </p>
                {m.kind === 'BRIEFING' && (
                  <div className="msg-actions">
                    {voteUrl && (
                      <a className="btn-action" href={voteUrl} target="_blank" rel="noopener noreferrer">Open MNET+</a>
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

        {racing && (
          <ProofCard crewId={crewId} proof={radio.proof} onChanged={reload} highlight={highlight || boardGlow} practice={practice} />
        )}

        {onPractice && <GoKartCard onStart={onPractice} />}
      </main>

      {racing && (
        <TodayChecklist radio={{ ...radio, voteUrl }} line={todayLine} onProof={goToProof} glow={boardGlow}
                        title={practice ? 'PRACTICE CHECKLIST' : undefined} />
      )}

      {ceremony.open && <PodiumCeremony podium={podium} myTeam={team.slug} onClose={ceremony.close} />}

      {showTour && <FormationLap team={team} onPractice={onPractice} onClose={endTour} />}
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

/** The way into the Go Kart practice race, at the end of the feed. */
function GoKartCard({ onStart }) {
  const [again] = useState(practiceDone)
  return (
    <section className="card gk-card" aria-labelledby="gk-card-title" data-tour="gokart">
      <div className="proof-title">
        <div className="eyebrow">GO KART · PRACTICE</div>
        <span className="gk-card-faces" aria-hidden="true">
          {Object.values(KARTS).map((k) => (
            <img key={k.slug} className="gk-avatar" src={k.img} alt="" width="40" height="40" />
          ))}
        </span>
      </div>
      <h2 id="gk-card-title" className="gk-card-title">{again ? 'Practice again' : 'Try the whole race on a tiny track'}</h2>
      <p className="muted small">
        Race Acorn or Potato through every phase: Grid, lights out, proof review, pit stop, Final Lap, podium.
        Nothing counts and nothing leaves your phone.
      </p>
      <button type="button" className="btn-secondary" onClick={onStart}>{again ? 'Race again' : 'Start practice'}</button>
    </section>
  )
}
