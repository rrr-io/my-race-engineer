import { useEffect, useState } from 'react'
import { adminCheck, adminPush, getRace, sendTestPush, setRace } from '../api.js'
import { PHASES, phaseInfo } from '../phases.js'

export default function Admin() {
  const [auth, setAuth] = useState(null)

  return (
    <div className="screen admin">
      <header className="home-head">
        <div>
          <div className="eyebrow">E1 RACE ENGINEER</div>
          <div className="team-name">Race Control</div>
        </div>
        <a className="admin-link" href="/">Back to app</a>
      </header>
      {auth ? <Panel auth={auth} onLogout={() => setAuth(null)} /> : <Login onLogin={setAuth} />}
    </div>
  )
}

function Login({ onLogin }) {
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError(null)
    const auth = { user, password }
    try {
      await adminCheck(auth)
      onLogin(auth)
    } catch (err) {
      setError(err.status === 401 ? 'Wrong username or password.' : "Can't reach the server.")
      setBusy(false)
    }
  }

  return (
    <form className="admin-body" onSubmit={submit}>
      <label className="field">
        Username
        <input value={user} onChange={(e) => setUser(e.target.value)}
               autoComplete="username" autoCapitalize="none" autoCorrect="off" />
      </label>
      <label className="field">
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
               autoComplete="current-password" />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn-primary" disabled={busy || !user || !password}>Log in</button>
    </form>
  )
}

function Panel({ auth, onLogout }) {
  const [race, setRaceState] = useState(null)
  const [picked, setPicked] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [push, setPush] = useState(null)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    adminPush(auth).then(setPush).catch(() => {})
    getRace()
      .then((r) => { setRaceState(r); setPicked(r.phase) })
      .catch(() => setError("Can't load the race state."))
  }, [])

  const apply = async (body) => {
    setBusy(true); setError(null)
    try {
      const r = await setRace(auth, body)
      setRaceState(r)
      setPicked(r.phase)
    } catch (err) {
      if (err.status === 401) { onLogout(); return }
      setError("Couldn't save. Try again.")
    } finally {
      setBusy(false)
    }
  }

  const sendTest = async () => {
    setBusy(true); setError(null); setTestResult(null)
    try {
      const r = await sendTestPush(auth)
      setTestResult(`Sent to ${r.sent} device${r.sent === 1 ? '' : 's'}.`)
    } catch (err) {
      if (err.status === 401) { onLogout(); return }
      setError("Couldn't send the test. Try again.")
    } finally {
      setBusy(false)
    }
  }

  const togglePractice = () => {
    const next = !race.practice
    const ok = window.confirm(`${next ? 'Start' : 'End'} free practice? This resets the phase to Grid for everyone.`)
    if (ok) apply({ practice: next })
  }

  if (!race) return <p className="admin-body muted">{error ?? 'Loading…'}</p>

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
        <div className="phase-list" role="radiogroup" aria-label="Race phase">
          {PHASES.map((p) => (
            <button key={p.key} type="button" role="radio" aria-checked={picked === p.key}
                    className={`phase-option ${picked === p.key ? 'is-picked' : ''}`}
                    onClick={() => setPicked(p.key)}>
              <span>{p.label}</span>
              <span className="muted small">{p.blurb}</span>
            </button>
          ))}
        </div>
        <button className="btn-primary" disabled={busy || picked === race.phase}
                onClick={() => apply({ phase: picked })}>
          Set phase
        </button>
      </section>

      <section className="card">
        <div className="eyebrow">FREE PRACTICE</div>
        <p className="muted small">Marks the race as a simulation. Switching it on or off resets the phase to Grid.</p>
        <button className="btn-secondary" disabled={busy} onClick={togglePractice}>
          {race.practice ? 'End free practice' : 'Start free practice'}
        </button>
      </section>

      <section className="card">
        <div className="eyebrow">PIT STOP</div>
        <p className="muted small">Pauses the race for everyone and posts a Race Control message in the app.</p>
        <button className="btn-secondary" disabled={busy}
                onClick={() => apply({ pitStop: !race.pitStop })}>
          {race.pitStop ? 'End pit stop' : 'Start pit stop'}
        </button>
      </section>

      <section className="card">
        <div className="eyebrow">NOTIFICATIONS</div>
        <p className="muted small">
          {!push && 'Checking push status…'}
          {push?.enabled && `Push is on · ${push.subscriptions} device${push.subscriptions === 1 ? '' : 's'} subscribed.`}
          {push && !push.enabled && 'Push is off. Add the VAPID keys to turn it on.'}
        </p>
        <button className="btn-secondary" disabled={busy || !push?.enabled} onClick={sendTest}>
          Send test notification
        </button>
        {testResult && <p className="muted small">{testResult}</p>}
      </section>

      {error && <p className="error" role="alert">{error}</p>}
      <button type="button" className="btn-link" onClick={onLogout}>Log out</button>
    </div>
  )
}
