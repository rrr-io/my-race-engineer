import { useEffect, useState } from 'react'
import {
  adminCategories, adminCheck, adminProofs, adminPush, adminReminders, adminVoteLink, putCategories,
  putReminders, putVoteLink, runReminders, sendTestPush
} from '../api.js'
import LivePanel from './AdminLive.jsx'
import ProofsPanel from './AdminProofs.jsx'
import WeekendPanel from './AdminWeekend.jsx'
import PaddockPanel from './AdminPaddock.jsx'

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
  const [tab, setTab] = useState('live')
  const [pending, setPending] = useState(null)

  useEffect(() => {
    adminProofs(auth).then((r) => setPending(r.pendingCount)).catch(() => {})
  }, [auth])

  const tabButton = (key, label) => (
    <button type="button" role="tab" aria-selected={tab === key}
            className={`tab ${tab === key ? 'is-active' : ''}`} onClick={() => setTab(key)}>
      {label}
    </button>
  )

  return (
    <>
      <nav className="tabs" role="tablist" aria-label="Race Control sections">
        {tabButton('live', 'Live')}
        {tabButton('proofs', pending ? `Proofs (${pending})` : 'Proofs')}
        {tabButton('paddock', 'Paddock')}
        {tabButton('weekend', 'Weekend')}
        {tabButton('setup', 'Setup')}
      </nav>
      {tab === 'live' && <LivePanel auth={auth} onLogout={onLogout} />}
      {tab === 'setup' && <SetupPanel auth={auth} onLogout={onLogout} />}
      {tab === 'proofs' && <ProofsPanel auth={auth} onLogout={onLogout} onCount={setPending} />}
      {tab === 'weekend' && <WeekendPanel auth={auth} onLogout={onLogout} />}
      {tab === 'paddock' && <PaddockPanel auth={auth} onLogout={onLogout} />}
    </>
  )
}

const remKey = (r) => JSON.stringify([r.enabled, Number(r.intervalHours), r.windowStart, r.windowEnd])

/** What changes between stages, not during them: categories, the MNET+ link, notifications, reminders. */
function SetupPanel({ auth, onLogout }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [push, setPush] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [catText, setCatText] = useState(null)
  const [catServer, setCatServer] = useState('')
  const [catSaved, setCatSaved] = useState(null)
  const [rem, setRem] = useState(null)
  const [remServer, setRemServer] = useState('')
  const [remResult, setRemResult] = useState(null)
  const [vote, setVote] = useState(null)
  const [voteServer, setVoteServer] = useState('')
  const [voteSaved, setVoteSaved] = useState(null)

  useEffect(() => {
    adminPush(auth).then(setPush).catch(() => {})
    adminVoteLink(auth).then((r) => { setVote(r.url); setVoteServer(r.url) }).catch(() => {})
    adminReminders(auth).then((r) => { setRem(r); setRemServer(remKey(r)) }).catch(() => {})
    adminCategories(auth)
      .then((r) => { const text = r.categories.map((c) => c.name).join('\n'); setCatText(text); setCatServer(text) })
      .catch(() => {})
  }, [])

  const saveCategories = async () => {
    setBusy(true); setError(null); setCatSaved(null)
    try {
      const r = await putCategories(auth, catText.split('\n'))
      const text = r.categories.map((c) => c.name).join('\n')
      setCatText(text); setCatServer(text)
      setCatSaved(`Saved · ${r.categories.length} categor${r.categories.length === 1 ? 'y' : 'ies'}.`)
    } catch (err) {
      if (err.status === 401) { onLogout(); return }
      setError(err.status === 400 ? 'Up to 20 categories, 80 characters each.' : "Couldn't save the categories. Try again.")
    } finally {
      setBusy(false)
    }
  }

  const saveVote = async () => {
    setBusy(true); setError(null); setVoteSaved(null)
    try {
      const r = await putVoteLink(auth, vote.trim())
      setVote(r.url); setVoteServer(r.url); setVoteSaved('Saved.')
    } catch (err) {
      if (err.status === 401) { onLogout(); return }
      setError(err.status === 400 ? 'Use a full https:// link.' : "Couldn't save the link. Try again.")
    } finally {
      setBusy(false)
    }
  }

  const saveReminders = async () => {
    setBusy(true); setError(null); setRemResult(null)
    try {
      const r = await putReminders(auth, { ...rem, intervalHours: Number(rem.intervalHours) })
      setRem(r); setRemServer(remKey(r)); setRemResult('Saved.')
    } catch (err) {
      if (err.status === 401) { onLogout(); return }
      setError(err.status === 400 ? 'Use 1 to 24 hours and two different times.' : "Couldn't save the reminders. Try again.")
    } finally {
      setBusy(false)
    }
  }

  const sendRemindersNow = async () => {
    if (!window.confirm('Send a reminder now to everyone who still has proofs to send?')) return
    setBusy(true); setError(null); setRemResult(null)
    try {
      const r = await runReminders(auth)
      setRemResult(`Reminded ${r.reminded} device${r.reminded === 1 ? '' : 's'}.`)
    } catch (err) {
      if (err.status === 401) { onLogout(); return }
      setError("Couldn't send the reminders. Try again.")
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

  return (
    <div className="admin-body">
      <section className="card">
        <div className="eyebrow">VOTING CATEGORIES</div>
        <p className="muted small">
          One per line, in the order fans see them. Change the list when a new stage starts. A category you keep
          (same name) keeps today's progress; one you remove is archived.
        </p>
        <textarea className="textarea" rows={6} aria-label="Voting categories" value={catText ?? ''}
                  disabled={catText === null} onChange={(e) => { setCatText(e.target.value); setCatSaved(null) }} />
        <button className="btn-secondary" disabled={busy || catText === null || catText === catServer}
                onClick={saveCategories}>
          Save categories
        </button>
        {catSaved && <p className="muted small">{catSaved}</p>}
      </section>

      <section className="card">
        <div className="eyebrow">MNET+ LINK</div>
        <p className="muted small">
          Where the "Open MNET+" button takes fans. Use the page or the link for the current stage; it must start
          with https://.
        </p>
        <label className="field">
          Link
          <input type="url" value={vote ?? ''} disabled={vote === null} autoCapitalize="none" autoCorrect="off"
                 onChange={(e) => { setVote(e.target.value); setVoteSaved(null) }} />
        </label>
        <button className="btn-secondary" disabled={busy || vote === null || vote.trim() === voteServer}
                onClick={saveVote}>
          Save link
        </button>
        {voteSaved && <p className="muted small">{voteSaved}</p>}
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

      <section className="card">
        <div className="eyebrow">REMINDERS</div>
        <p className="muted small">
          While a race phase is on (and no pit stop), fans who still have categories to do get a radio call from their
          engineer, in their own local time and only inside this window. It stops once every category has a proof in
          review or approved, and starts again if one is rejected.
        </p>
        {rem && (
          <>
            <label className="check">
              <input type="checkbox" checked={rem.enabled} onChange={(e) => { setRem({ ...rem, enabled: e.target.checked }); setRemResult(null) }} />
              Send reminders
            </label>
            <label className="field">
              Repeat every (hours)
              <input type="number" min="1" max="24" value={rem.intervalHours}
                     onChange={(e) => { setRem({ ...rem, intervalHours: e.target.value }); setRemResult(null) }} />
            </label>
            <div className="row2">
              <label className="field">
                From (fan's local time)
                <input type="time" value={rem.windowStart}
                       onChange={(e) => { setRem({ ...rem, windowStart: e.target.value }); setRemResult(null) }} />
              </label>
              <label className="field">
                Until
                <input type="time" value={rem.windowEnd}
                       onChange={(e) => { setRem({ ...rem, windowEnd: e.target.value }); setRemResult(null) }} />
              </label>
            </div>
            <button className="btn-secondary" disabled={busy || remKey(rem) === remServer} onClick={saveReminders}>
              Save reminders
            </button>
            <button className="btn-secondary" disabled={busy} onClick={sendRemindersNow}>
              Send a reminder now
            </button>
          </>
        )}
        {remResult && <p className="muted small">{remResult}</p>}
      </section>

      {error && <p className="error" role="alert">{error}</p>}
      <button type="button" className="btn-link" onClick={onLogout}>Log out</button>
    </div>
  )
}
