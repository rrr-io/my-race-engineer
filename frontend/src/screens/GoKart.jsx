import { useCallback, useEffect, useRef, useState } from 'react'
import RadioHead from '../RadioHead.jsx'
import TodayChecklist from '../TodayChecklist.jsx'
import { phaseInfo } from '../phases.js'
import { teamStyle } from '../teams.js'
import { CATEGORY, KARTS, MAX_SHOTS, REJECT_REASON, checkCertificate, rememberPractice, rivalOf } from '../gokart.js'

// Only the start lights and Race Control's review run on a timer. Every phase change waits for the fan's tap,
// so there's always time to read the radio.
const LIGHT_MS = 320
const OUT_MS = 380
const REVIEW_MS = 2600
const QUICK_REVIEW_MS = 1600
const RIVAL_TICK_MS = 1000

const TAGS = { MISSING: 'TO DO', PENDING: 'UNDER REVIEW', APPROVED: 'APPROVED', REJECTED: 'TO REDO' }
const RACING = ['SPRINT_RACE', 'GRAND_PRIX', 'FINAL_LAP']

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/** Flat kart silhouette in the kart's colour, number on the side. */
export function Kart({ kart, width = 132 }) {
  const bg = '#1A1C21'
  const c = kart.color
  return (
    <svg width={width} height={width * 60 / 132} viewBox="0 0 132 60" role="img" aria-label={`Kart No. ${kart.number}`}>
      <path d="M8 52 L8 46 C20 36 36 31 48 30 L74 30 C92 32 110 38 124 45 L124 52 Z" fill={c} />
      <path d="M46 31 L49 17 C50 14 56 14 58 17 L62 31 Z" fill={c} />
      <circle cx="54" cy="11" r="8" fill={c} />
      <rect x="55" y="8" width="8" height="4" rx="2" fill={bg} />
      <path d="M56 22 L80 28" stroke={c} strokeWidth="5" strokeLinecap="round" />
      <path d="M78 31 L86 21" stroke={c} strokeWidth="4" strokeLinecap="round" />
      <rect x="96" y="45" width="28" height="3" fill={bg} />
      <circle cx="32" cy="48" r="10" fill={c} stroke={bg} strokeWidth="3.5" />
      <circle cx="98" cy="48" r="10" fill={c} stroke={bg} strokeWidth="3.5" />
      <text x="65" y="45" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="700" fill={bg}>
        {kart.number}
      </text>
    </svg>
  )
}

const Avatar = ({ kart, size = 38, label }) => (
  <img className="gk-avatar" src={kart.img} alt={label ?? kart.name} width={size} height={size}
       style={{ width: size, height: size }} />
)

/** Step 1: Acorn or Potato. */
function PickKart({ onStart, onLeave }) {
  const [pick, setPick] = useState('acorn')
  const kart = KARTS[pick]
  return (
    <div className="screen gokart gk-pick">
      <div className="gk-pick-head">
        <div className="eyebrow">GO KART · PRACTICE RACE</div>
        <h1>Pick your kart</h1>
        <p className="muted">A practice race just for you: every phase of race day on a small track. Nothing you send counts or leaves your phone.</p>
      </div>
      <div className="gk-karts" role="radiogroup" aria-label="Kart">
        {Object.values(KARTS).map((k) => {
          const picked = k.slug === pick
          return (
            <button key={k.slug} type="button" role="radio" aria-checked={picked}
                    className={`gk-kart ${picked ? 'is-picked' : ''}`} style={{ '--kart': k.color }}
                    onClick={() => setPick(k.slug)}>
              <Avatar kart={k} size={96} label="" />
              <Kart kart={k} />
              <span className="gk-kart-name">{k.name.toUpperCase()}</span>
              <span className="gk-kart-tag">{picked ? 'PICKED' : 'RIVAL'} · NO. {k.number}</span>
            </button>
          )
        })}
      </div>
      <div className="gk-pick-notes muted small">
        <p>You'll go through: Grid · Lights out · Sprint Race · proof review · Pit stop · Grand Prix · Final Lap · Finish Line.</p>
        <p>Have a certificate from an old vote ready in your gallery.</p>
      </div>
      <div className="gk-pick-foot">
        <button type="button" className="btn-primary gk-go" style={{ '--kart': kart.color }} onClick={() => onStart(pick)}>
          Start practice with {kart.name}
        </button>
        <button type="button" className="btn-link" onClick={onLeave}>Not now</button>
      </div>
    </div>
  )
}

/** The small track: two lanes, the chequered line on the right. */
function Track({ me, rival, pos, lit, lights, paused }) {
  return (
    <div className={`gk-track ${paused ? 'is-paused' : ''}`} aria-label={`${me.name} at ${Math.round(pos.me)}%, ${rival.name} at ${Math.round(pos.rival)}%`} role="img">
      {lights ? (
        <div className="start-lights gk-lights" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => <span key={i} className={`start-light ${i < lit ? 'is-on' : ''}`} />)}
        </div>
      ) : (
        <>
          <div className="gk-lane-line" aria-hidden="true" />
          <div className="gk-flag" aria-hidden="true" />
          <span className="gk-runner is-me" style={{ '--p': pos.me }}><Avatar kart={me} label="" /></span>
          <span className="gk-runner is-rival" style={{ '--p': pos.rival }}><Avatar kart={rival} label="" /></span>
        </>
      )}
    </div>
  )
}

/** The practice proof: real certificate from the gallery, checked here, never uploaded. */
function PracticeProof({ state, shots, busy, error, onPick, onRemove, onSend, highlight }) {
  const open = state === 'MISSING' || state === 'REJECTED'
  return (
    <section id="gk-proof" className={`card proof ${highlight ? 'is-highlight' : ''}`}>
      <div className="proof-title">
        <div className="eyebrow">PRACTICE PROOF</div>
        <span className="pit-tag">NOT COUNTED</span>
      </div>
      <p className="muted small">Use a certificate from a vote you already did. It's only checked on your phone: nothing is sent to Race Control.</p>
      <div className="category">
        <div className="category-head">
          <strong>{CATEGORY}</strong>
          <span className="pit-tag">{TAGS[state]}</span>
        </div>
        {state === 'PENDING' && <p className="muted small">Under review by Race Control. You'll get a radio call with the result.</p>}
        {state === 'REJECTED' && <p className="error small">Rejected: {REJECT_REASON}</p>}
        {state === 'APPROVED' && <p className="muted small">Approved. Wait for the next call.</p>}
        {open && shots.length > 0 && (
          <div className="thumbs">
            {shots.map((s, i) => (
              <div className="thumb" key={s.url}>
                <img src={s.url} alt={`Certificate ${i + 1}`} />
                <button type="button" className="thumb-remove" aria-label={`Remove certificate ${i + 1}`} onClick={() => onRemove(i)}>×</button>
              </div>
            ))}
          </div>
        )}
        {open && (
          <>
            <input id="gk-file" type="file" accept="image/*" multiple hidden onChange={onPick} />
            <button type="button" className="btn-secondary" disabled={busy || shots.length >= MAX_SHOTS}
                    onClick={() => document.getElementById('gk-file').click()}>
              {shots.length ? 'Add another certificate' : 'Choose a certificate'}
            </button>
            <p className="muted small">{shots.length} of {MAX_SHOTS} certificates</p>
          </>
        )}
      </div>
      {open && (
        <button type="button" className="btn-primary" disabled={!shots.length || busy} onClick={onSend}>
          {busy ? 'Checking…' : shots.length ? `Send proof (${shots.length})` : 'Send proof'}
        </button>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  )
}

/** Finish Line: the practice podium. */
function PracticePodium({ me, rival, team, onHome, onAgain }) {
  useEffect(() => { rememberPractice() }, [])
  return (
    <div className="ceremony gk-podium" role="dialog" aria-modal="true" aria-labelledby="gk-podium-title" style={teamStyle(team)}>
      <div className="chequer" aria-hidden="true" />
      <div className="ceremony-head">
        <div className="eyebrow">GO KART · CHEQUERED FLAG</div>
        <h1 id="gk-podium-title">Practice complete</h1>
        <p className="ceremony-p1" style={{ color: me.color }}>P1 · {me.name.toUpperCase()} · NO. {me.number}</p>
      </div>
      <div className="podium">
        <div className="podium-col is-p2" style={{ '--accent': rival.color, '--on-accent': '#0E0F12' }}>
          <div className="podium-team">
            <Avatar kart={rival} size={64} />
            <div className="podium-name">{rival.name.toUpperCase()}</div>
          </div>
          <div className="podium-step"><span>2</span></div>
        </div>
        <div className="podium-col is-p1" style={{ '--accent': me.color, '--on-accent': '#0E0F12' }}>
          <div className="podium-team">
            <span className="podium-mine">YOU</span>
            <Avatar kart={me} size={80} />
            <div className="podium-name">{me.name.toUpperCase()}</div>
          </div>
          <div className="podium-step"><span>1</span></div>
        </div>
      </div>
      <article className="radio gk-podium-radio">
        <RadioHead from="ENGINEER" />
        <div className="radio-body"><p className="radio-text">"You know the whole race now. See you on the real grid!"</p></div>
      </article>
      <div className="gk-podium-actions">
        <button type="button" className="btn-primary" onClick={onHome}>Back to the pit wall</button>
        <button type="button" className="btn-secondary" onClick={onAgain}>Race again</button>
      </div>
    </div>
  )
}

/**
 * Go Kart: a local practice race for one fan. Same phases as race day (Grid, Lights out, Sprint Race, review,
 * Pit stop, Grand Prix, Final Lap, Finish Line), all scripted on the phone. The first proof is sent back on
 * purpose so the fan sees a rejection; the certificate never leaves the phone and never counts.
 * The fan moves the race on with a button in the latest radio call; earlier calls stay below, by phase.
 */
export default function GoKart({ team, onLeave }) {
  const [round, setRound] = useState(0)
  return <Race key={round} team={team} onLeave={onLeave} onAgain={() => setRound((r) => r + 1)} />
}

function Race({ team, onLeave, onAgain }) {
  const [kart, setKart] = useState(null)
  const [stage, setStage] = useState('grid')        // grid | lights | race | finish
  const [phase, setPhase] = useState('GRID')
  const [lit, setLit] = useState(0)
  const [pit, setPit] = useState(false)
  const [proofOpen, setProofOpen] = useState(false) // Grand Prix: the proof card comes back after the pit stop
  const [proof, setProof] = useState('MISSING')
  const [rejected, setRejected] = useState(false)   // the scripted rejection happens once
  const [shots, setShots] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [highlight, setHighlight] = useState(false)
  const [messages, setMessages] = useState([])
  const [batch, setBatch] = useState(0)
  const [pos, setPos] = useState({ me: 2, rival: 2 })
  const batchRef = useRef(0)
  const timers = useRef([])
  const urls = useRef(new Set())

  const later = useCallback((fn, ms) => { timers.current.push(setTimeout(fn, ms)) }, [])
  useEffect(() => () => {
    timers.current.forEach(clearTimeout)
    urls.current.forEach((u) => URL.revokeObjectURL(u))
  }, [])

  const me = kart ? KARTS[kart] : null
  const rival = kart ? rivalOf(kart) : null

  /** New radio calls, newest first. Each entry: [from, text, kind, next]; `next` is the button that moves the race on. */
  const say = useCallback((list, inPhase) => {
    const at = new Date().toISOString()
    const n = ++batchRef.current
    const stamped = list.map(([from, text, kind = null, next = null], i) =>
      ({ id: `${n}-${i}`, from, text, kind, next, at, batch: n, phase: inPhase }))
    setMessages((current) => [...stamped.reverse(), ...current])
    setBatch(n)
  }, [])

  // a moment to scroll back to the top when a new call comes in, so it's read first
  const toTop = () => window.scrollTo?.({ top: 0, behavior: 'smooth' })

  // the rival keeps pushing while the race is live, never too far ahead; it stops in the pit like everyone
  useEffect(() => {
    if (stage !== 'race' || pit || !RACING.includes(phase)) return undefined
    const t = setInterval(() => setPos((p) => ({ ...p, rival: Math.min(p.rival + 0.8, p.me + 9, 94) })), RIVAL_TICK_MS)
    return () => clearInterval(t)
  }, [stage, pit, phase])

  const start = (slug) => {
    setKart(slug)
    say([['ENGINEER', "Practice kart's warm! Same race as the real one, just a tiny track. I'll call every step like on race day. Ready when you are."]], 'GRID')
  }

  const goSprint = () => {
    setStage('race'); setPhase('SPRINT_RACE'); setPos({ me: 8, rival: 10 })
    say([
      ['RACE_CONTROL', 'Lights out! Sprint Race is live.'],
      ['ENGINEER', `Today's lap: ${CATEGORY}. On race day you'd vote on MNET+ now. For practice, grab a certificate from an old vote!`, 'BRIEFING']
    ], 'SPRINT_RACE')
  }

  const lightsOut = () => {
    if (reducedMotion()) { goSprint(); return }
    setStage('lights'); setLit(0)
    for (let i = 1; i <= 5; i++) later(() => setLit(i), LIGHT_MS * i)
    later(() => setLit(0), LIGHT_MS * 5 + OUT_MS)
    later(goSprint, LIGHT_MS * 5 + OUT_MS + 200)
  }

  const goToProof = useCallback(() => {
    document.getElementById('gk-proof')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    setHighlight(true)
    later(() => setHighlight(false), 2400)
  }, [later])

  const onPick = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setBusy(true); setError(null)
    const room = MAX_SHOTS - shots.length
    const added = []
    let problem = files.length > room ? `You can add up to ${room} more here.` : null
    for (const file of files.slice(0, room)) {
      const wrong = await checkCertificate(file)
      if (wrong) { problem = wrong; continue }
      const url = URL.createObjectURL(file)
      urls.current.add(url)
      added.push({ file, url })
    }
    setShots((s) => [...s, ...added])
    setError(problem)
    setBusy(false)
  }

  const onRemove = (i) => { setShots((s) => s.filter((_, j) => j !== i)); setError(null) }

  // Grand Prix opens with a pit stop: the race freezes until the fan resumes it
  const startGrandPrix = () => {
    setPhase('GRAND_PRIX'); setProof('MISSING'); setProofOpen(false); setPit(true)
    setPos((p) => ({ me: Math.max(p.me, 40), rival: Math.max(p.rival, 44) }))
    say([
      ['RACE_CONTROL', 'Grand Prix is live.'],
      ['RACE_CONTROL', 'Pit stop. Race Control is pausing the race for team coordination. Hold position, instructions coming.', null,
        { label: 'Resume the race', go: 'resume' }]
    ], 'GRAND_PRIX')
    toTop()
  }

  const resume = () => {
    setPit(false); setProofOpen(true)
    say([
      ['RACE_CONTROL', 'Back on track. Grand Prix resumes.'],
      ['ENGINEER', `Go go go! Same job: one certificate for ${CATEGORY}. Yours is still loaded, one tap and it's in.`, 'BRIEFING']
    ], 'GRAND_PRIX')
    toTop()
  }

  const startFinalLap = () => {
    setPhase('FINAL_LAP'); setProof('MISSING')
    setPos({ me: 74, rival: 76 })
    say([['ENGINEER', `Final Lap! ${rival.name} is right behind us. Send the certificate one last time and push!`, 'FINAL']], 'FINAL_LAP')
    toTop()
  }

  const toPodium = () => { setPhase('FINISH_LINE'); setStage('finish') }

  const next = { gp: startGrandPrix, resume, final: startFinalLap, podium: toPodium }

  const send = () => {
    if (!shots.length || busy || proof === 'PENDING') return
    const inPhase = phase
    setError(null); setProof('PENDING')
    say([['ENGINEER', "Got it. It's with Race Control now: under review."]], inPhase)
    toTop()
    if (inPhase === 'SPRINT_RACE' && !rejected) {
      later(() => {
        setRejected(true); setProof('REJECTED')
        setPos((p) => ({ ...p, rival: Math.max(p.rival, p.me + 8) }))
        say([
          ['RACE_CONTROL', `Practice review: ${CATEGORY} sent back. Reason: ${REJECT_REASON}. On race day, this is what a rejection looks like.`],
          ['ENGINEER', 'Happens to everyone! Check the reason and send it again. The same certificate is fine here.']
        ], inPhase)
      }, REVIEW_MS)
      return
    }
    later(() => {
      setProof('APPROVED')
      if (inPhase === 'SPRINT_RACE') {
        setPos((p) => ({ me: Math.max(p.me, 34), rival: Math.max(p.rival, 32) }))
        say([
          ['RACE_CONTROL', `Practice review: ${CATEGORY} approved.`],
          ['ENGINEER', 'APPROVED! Sprint Race in the bag. Ready for the Grand Prix?', null, { label: 'On to the Grand Prix', go: 'gp' }]
        ], inPhase)
      } else if (inPhase === 'GRAND_PRIX') {
        setPos((p) => ({ me: Math.max(p.me, 66), rival: Math.max(p.rival, 64) }))
        say([
          ['RACE_CONTROL', `Practice review: ${CATEGORY} approved.`],
          ['ENGINEER', `APPROVED! Grand Prix done. Only the Final Lap left, and ${rival.name} won't give up.`, null,
            { label: 'On to the Final Lap', go: 'final' }]
        ], inPhase)
      } else {
        setPos({ me: 100, rival: 95 })
        say([
          ['RACE_CONTROL', 'Chequered flag! Practice complete.'],
          ['ENGINEER', `WE DID IT! P1, ${me.name}!`, null, { label: 'To the podium', go: 'podium' }]
        ], inPhase)
      }
    }, inPhase === 'SPRINT_RACE' ? REVIEW_MS : QUICK_REVIEW_MS)
  }

  if (!kart) return <PickKart onStart={start} onLeave={onLeave} />

  if (stage === 'finish') return <PracticePodium me={me} rival={rival} team={team} onHome={onLeave} onAgain={onAgain} />

  const racing = stage === 'race' && RACING.includes(phase) && !pit
  // Final Lap is one tap on the saved certificate; the card only comes back if there's nothing saved
  const showProof = racing && proof !== 'APPROVED' &&
    (phase === 'FINAL_LAP' ? !shots.length : phase !== 'GRAND_PRIX' || proofOpen)
  const status = pit ? { kind: 'pit', label: 'PIT STOP' }
    : stage === 'race' ? { kind: 'live', label: 'LIVE' }
      : { kind: 'waiting', label: 'WAITING FOR LIGHTS OUT' }
  const checklist = { voteUrl: null, proof: { done: proof === 'APPROVED', categories: [{ id: 1, name: CATEGORY, state: proof, count: 0 }] } }
  const todayLine = messages.find((m) => m.from === 'ENGINEER')?.text ?? null
  const latest = messages.filter((m) => m.batch === batch)
  const earlier = messages.filter((m) => m.batch !== batch)

  const call = (m, live) => (
    <article className={`radio ${live ? 'is-new' : 'is-earlier'}`} key={m.id}>
      <RadioHead from={m.from} fresh={live} at={m.at} />
      <div className="radio-body">
        <p className="radio-text">"{m.text}"</p>
        {live && m.kind === 'BRIEFING' && showProof && (
          <div className="msg-actions">
            <span className="btn-action gk-raceday" aria-disabled="true">Open MNET+ · race day</span>
            <button type="button" className="btn-action" onClick={goToProof}>Upload proof</button>
          </div>
        )}
        {live && m.kind === 'FINAL' && proof === 'MISSING' && shots.length > 0 && (
          <div className="msg-actions">
            <button type="button" className="btn-action" onClick={send}>Push to the line</button>
          </div>
        )}
        {live && m.next && (
          <div className="msg-actions">
            <button type="button" className="btn-action" onClick={next[m.next.go]}>{m.next.label}</button>
          </div>
        )}
      </div>
    </article>
  )

  return (
    <div className={`screen home gokart ${racing ? 'has-dock' : ''} ${pit ? 'is-pit' : ''}`} style={{ ...teamStyle(team), '--kart': me.color }}>
      <div className="gk-bar">
        <span className="gk-bar-tag">GO KART · PRACTICE</span>
        <button type="button" className="gk-bar-tag gk-leave" onClick={onLeave}>Leave</button>
      </div>
      <div className="race-status">
        <span>{phaseInfo(phase).label.toUpperCase()}</span>
        <span className={`status is-${status.kind}`}><span className="status-mark" aria-hidden="true" />{status.label}</span>
      </div>

      <Track me={me} rival={rival} pos={pos} lit={lit} lights={stage === 'lights'} paused={pit} />

      <main className="feed">
        <div className="gk-latest" aria-live="polite">{latest.map((m) => call(m, true))}</div>

        {stage === 'grid' && (
          <>
            <p className="muted small">On race day Race Control starts the race for everyone. In practice, you do.</p>
            <button type="button" className="btn-primary gk-go" onClick={lightsOut}>Lights out</button>
          </>
        )}

        {pit && <p className="muted small">On race day a pit stop freezes the stage until Race Control resumes it. In practice, you do.</p>}

        {phase === 'GRAND_PRIX' && !pit && proofOpen && proof === 'MISSING' && (
          <p className="muted small">Grand Prix and Final Lap replay the same loop faster: briefing, a tap on the saved certificate, approval.</p>
        )}

        {showProof && (
          <PracticeProof state={proof} shots={shots} busy={busy} error={error} highlight={highlight}
                         onPick={onPick} onRemove={onRemove} onSend={send} />
        )}

        {earlier.length > 0 && (
          <section className="gk-earlier" aria-label="Earlier on the radio">
            <div className="eyebrow">EARLIER ON THE RADIO</div>
            {earlier.map((m, i) => (
              <div key={m.id} className="gk-earlier-item">
                {(i === 0 || earlier[i - 1].phase !== m.phase) && (
                  <div className="gk-phase-mark">{phaseInfo(m.phase).label.toUpperCase()}</div>
                )}
                {call(m, false)}
              </div>
            ))}
          </section>
        )}
      </main>

      {racing && (
        <TodayChecklist radio={checklist} line={todayLine} practice
                        uploadLabel={phase === 'FINAL_LAP' && shots.length ? 'Push to the line' : 'Upload proof'}
                        onProof={phase === 'FINAL_LAP' && shots.length ? send : goToProof} />
      )}
    </div>
  )
}
