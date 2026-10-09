import { useCallback, useEffect, useRef, useState } from 'react'
import { adminProofs, approveProof, fetchProofImage, rejectProof } from '../api.js'
import { phaseInfo } from '../phases.js'
import { teamBySlug } from '../teams.js'

const PRESETS = ['Not readable', 'Wrong app', 'Wrong day', "Doesn't show a vote"]
const POLL_MS = 30000

const kstTime = (iso) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false })
    .format(new Date(iso))
const kstToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())

const groupByFan = (items) => {
  const groups = new Map()
  items.forEach((p) => {
    const key = `${p.crewId}|${p.day}|${p.practice}|${p.phase}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(p)
  })
  return [...groups.values()]
}

export default function ProofsPanel({ auth, onLogout, onCount }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)
  const callbacks = useRef({ onLogout, onCount })
  callbacks.current = { onLogout, onCount }

  const load = useCallback(() =>
    adminProofs(auth)
      .then((r) => { setItems(r.pending); callbacks.current.onCount(r.pendingCount); setError(null) })
      .catch((err) => {
        if (err.status === 401) callbacks.current.onLogout()
        else setError("Can't load the proofs.")
      }), [auth])

  useEffect(() => {
    load()
    const timer = setInterval(load, POLL_MS)
    return () => clearInterval(timer)
  }, [load])

  if (!items) return <p className="admin-body muted">{error ?? 'Loading…'}</p>

  return (
    <div className="admin-body">
      <div className="eyebrow">BETA TESTING · {items.length} WAITING</div>
      {items.length === 0 && <p className="muted">No proofs waiting for review.</p>}
      {groupByFan(items).map((group) => (
        <FanGroup key={`${group[0].crewId}|${group[0].day}|${group[0].practice}|${group[0].phase}`} auth={auth} group={group} onLogout={onLogout} onDone={load} />
      ))}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}

function FanGroup({ auth, group, onLogout, onDone }) {
  const first = group[0]
  const team = teamBySlug(first.team)
  const [busy, setBusy] = useState(false)

  const approveAll = async () => {
    setBusy(true)
    try {
      for (const proof of group) {
        try { await approveProof(auth, proof.id) } catch (err) { if (err.status !== 409) throw err }
      }
    } catch (err) {
      if (err.status === 401) { onLogout(); return }
    }
    await onDone()
    setBusy(false)
  }

  return (
    <article className="card proof-item">
      <div className="proof-head">
        <strong>Team {team?.member ?? 'unknown'}</strong>
        <span className="muted small">{kstTime(first.createdAt)} KST · {phaseInfo(first.phase).label}</span>
      </div>
      <div className="tags">
        {first.practice && <span className="pit-tag">FREE PRACTICE</span>}
        {first.day !== kstToday() && <span className="pit-tag">PREVIOUS DAY · NO PUSH</span>}
      </div>
      {group.map((proof) => (
        <ProofRow key={proof.id} auth={auth} proof={proof} onLogout={onLogout} onDone={onDone} />
      ))}
      {group.length > 1 && (
        <button type="button" className="btn-secondary" disabled={busy} onClick={approveAll}>
          Approve all {group.length}
        </button>
      )}
    </article>
  )
}

function ProofRow({ auth, proof, onLogout, onDone }) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const decide = async (approve) => {
    setBusy(true); setError(null)
    try {
      if (approve) await approveProof(auth, proof.id)
      else await rejectProof(auth, proof.id, reason.trim())
      await onDone()
    } catch (err) {
      if (err.status === 401) { onLogout(); return }
      if (err.status === 409) { await onDone(); return }
      setError("Couldn't save the decision. Try again.")
      setBusy(false)
    }
  }

  return (
    <div className="proof-row">
      <ProofImage auth={auth} id={proof.id} />
      <div className="proof-side">
        <strong>{proof.category}</strong>
        {rejecting ? (
          <div className="reject-form">
            <label className="field">
              Reason (sent to the fan)
              <input value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} />
            </label>
            <div className="chips">
              {PRESETS.map((p) => (
                <button key={p} type="button" className="chip" onClick={() => setReason(p)}>{p}</button>
              ))}
            </div>
            <div className="proof-actions">
              <button type="button" className="btn-primary" disabled={busy || !reason.trim()}
                      onClick={() => decide(false)}>Send rejection</button>
              <button type="button" className="btn-secondary" disabled={busy}
                      onClick={() => setRejecting(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="proof-actions">
            <button type="button" className="btn-primary" disabled={busy} onClick={() => decide(true)}>Approve</button>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => setRejecting(true)}>Reject</button>
          </div>
        )}
        {error && <p className="error" role="alert">{error}</p>}
      </div>
    </div>
  )
}

function ProofImage({ auth, id }) {
  const [url, setUrl] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    let objectUrl = null
    fetchProofImage(auth, id)
      .then((blob) => {
        if (!alive) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [auth, id])

  if (failed) return <div className="proof-img">Can't load</div>
  if (!url) return <div className="proof-img" aria-busy="true" />
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img className="proof-img" src={url} alt="Screenshot sent by the fan" />
    </a>
  )
}
