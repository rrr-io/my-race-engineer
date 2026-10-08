import { useEffect, useState } from 'react'
import { usePush } from '../usePush.js'

/** Once radio calls are on, the engineer says hello as a real notification, so the fan sees one works. */
async function sayHello(team) {
  try {
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000))
    ])
    await reg.showNotification('Race Engineer', { body: team.radioCheck, tag: 'radio-check', icon: '/icons/icon-192-v2.png' })
  } catch { /* the screen already says it worked */ }
}

/** Second onboarding step: get radio calls working before the fan reaches the home. */
export default function RadioCheck({ team, crewId, onDone }) {
  const { status, busy, error, enable } = usePush(crewId)
  const [asked, setAsked] = useState(false)

  // nothing to set up: push is off on the server, or this device already has it
  useEffect(() => {
    if (status === 'hidden' || (status === 'on' && !asked)) onDone()
  }, [status, asked, onDone])

  useEffect(() => {
    if (asked && status === 'on') sayHello(team)
  }, [asked, status, team])

  const turnOn = () => { setAsked(true); enable() }

  let line
  let body = null
  if (status === 'loading' || status === 'hidden') {
    line = 'Checking the radio…'
  } else if (status === 'on') {
    line = team.radioCheck
    body = <p className="muted small">Radio calls are on. You'll hear from me at every Lights Out and when a proof is reviewed.</p>
  } else if (status === 'install') {
    line = "On iPhone I can only reach you from the Home Screen. Let's fix that first."
    body = (
      <>
        <ol className="steps">
          <li>Open this page in Safari.</li>
          <li>Tap Share, then Add to Home Screen.</li>
          <li>Open RACE ENGENEer from your Home Screen and turn on radio calls there.</li>
        </ol>
        <p className="muted small">Needs iOS 16.4 or later.</p>
      </>
    )
  } else if (status === 'blocked') {
    line = "I can't get through: notifications are blocked for this app."
    body = <p className="muted small">Turn them on in your phone or browser settings, then reload. You can still use the app without them.</p>
  } else if (status === 'unsupported') {
    line = "This browser can't receive my radio calls."
    body = <p className="muted small">Open the app every day instead, or try another browser.</p>
  } else {
    line = 'Radio check. Can you hear me? Turn on radio calls so I can tell you when to vote.'
    body = <p className="muted small">One call when a race phase starts, a reminder while you still have proofs to send, and the result of each review.</p>
  }

  const ready = status === 'on'
  return (
    <div className="screen onboarding" style={{ '--accent': team.accent }}>
      <header className="onb-head">
        <div className="eyebrow">STEP 2 OF 2 · RADIO CHECK</div>
        <h1>Team {team.member}</h1>
      </header>

      <article className="radio">
        <div className="radio-label">RADIO · ENGINEER</div>
        <p className="radio-text">"{line}"</p>
      </article>
      {body}
      {error && <p className="error" role="alert">{error}</p>}

      <footer className="onb-foot">
        {status === 'ask' && (
          <button className="btn-primary" disabled={busy} onClick={turnOn}>Turn on radio calls</button>
        )}
        {ready && <button className="btn-primary" onClick={onDone}>Go to the pit wall</button>}
        {status === 'ask' && <button className="btn-link" disabled={busy} onClick={onDone}>Not now</button>}
        {!ready && status !== 'ask' && (
          <button className="btn-primary" disabled={status === 'loading'} onClick={onDone}>Continue</button>
        )}
      </footer>
    </div>
  )
}
