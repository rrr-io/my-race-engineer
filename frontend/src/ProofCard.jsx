import { useEffect, useRef, useState } from 'react'
import { submitProof } from './api.js'
import { prepareImage } from './images.js'
import { lapLine } from './lap.js'
import { useNow } from './useNow.js'

const TAGS = { MISSING: 'TO DO', PENDING: 'UNDER REVIEW', APPROVED: 'APPROVED', REJECTED: 'TO REDO' }

const messageFor = (err) => {
  if (err.status === 400) return "That wasn't accepted: use JPEG, PNG or WebP certificates, and only categories on the list."
  if (err.status === 413) return 'Your proof is too large. Try a smaller one.'
  if (err.status === 409) return 'Uploads are closed right now. Wait for the next race phase.'
  if (err.status === 404) return 'We lost your team. Reload the app.'
  return "Couldn't send your proof. Check your connection and try again."
}

/** `practice`: free practice, a certificate from an old vote that Race Control reviews for real but never counts. */
export default function ProofCard({ crewId, proof, onChanged, highlight = false, practice = false }) {
  const [picked, setPicked] = useState({})
  const [busy, setBusy] = useState(false)
  const now = useNow()
  const [error, setError] = useState(null)
  const latest = useRef(picked)
  latest.current = picked

  useEffect(() => () => Object.values(latest.current).flat().forEach((p) => URL.revokeObjectURL(p.url)), [])

  if (!proof) return null
  // no limit on proofs: every certificate counts for the team. They go up a few at a time (maxPerSubmission).
  const { categories, done, maxPerSubmission } = proof
  const total = Object.values(picked).flat().length

  const onPick = (category, e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    const added = files.map((file) => ({ file, url: URL.createObjectURL(file) }))
    setError(null)
    setPicked((current) => ({ ...current, [category.id]: [...(current[category.id] ?? []), ...added] }))
  }

  const remove = (categoryId, index) => {
    URL.revokeObjectURL(picked[categoryId][index].url)
    setPicked((current) => ({ ...current, [categoryId]: current[categoryId].filter((_, i) => i !== index) }))
    setError(null)
  }

  const send = async () => {
    setBusy(true); setError(null)
    const items = categories.flatMap((c) => (picked[c.id] ?? []).map((p) => ({ categoryId: c.id, picked: p })))
    const size = Math.max(1, maxPerSubmission || 10)
    const sent = new Set()
    try {
      for (let i = 0; i < items.length; i += size) {
        const batch = items.slice(i, i + size)
        const prepared = await Promise.all(batch.map(async (item) => ({ categoryId: item.categoryId, file: await prepareImage(item.picked.file) })))
        await submitProof(crewId, prepared)
        batch.forEach((item) => sent.add(item.picked))
      }
    } catch (err) {
      setError(messageFor(err))
    } finally {
      // what went up leaves the card; anything that failed stays, ready to send again
      sent.forEach((p) => URL.revokeObjectURL(p.url))
      setPicked((current) => Object.fromEntries(Object.entries(current).map(([id, list]) => [id, list.filter((p) => !sent.has(p))])))
      if (sent.size) onChanged()
      setBusy(false)
    }
  }

  return (
    <section id="proof-card" className={`card proof ${highlight ? 'is-highlight' : ''}`}>
      <div className="proof-title">
        <div className="eyebrow">{practice ? 'FREE PRACTICE · NOT COUNTED' : "TODAY'S PROOF · KST"}</div>
        {done && <span className="pit-tag">ALL DONE</span>}
      </div>
      {categories.length > 0 && <p className="muted small">The proof day follows Korea time. {lapLine(now)}.</p>}
      {categories.length === 0 && (
        <p className="muted small">Race Control hasn't announced today's categories yet. Check back soon.</p>
      )}
      {categories.length > 0 && !done && (
        <p className="muted small">
          {practice
            ? "Send a certificate from an old vote for every category. Race Control checks it for real, but it doesn't count for the race."
            : 'Vote on MNET+, then send certificates for every category.'}
        </p>
      )}
      {done && (
        <p className="muted small">
          {practice ? "Practice done! That's exactly how race day works." : "You're done for today. See you at the next lap."}
          {!practice && ' Extra certificates still count for your team.'}
        </p>
      )}

      {categories.map((c) => {
        const mine = picked[c.id] ?? []
        return (
          <div className="category" key={c.id}>
            <div className="category-head">
              <strong>{c.name}</strong>
              <span className="pit-tag">{TAGS[c.state]}</span>
            </div>
            {c.state === 'PENDING' && <p className="muted small">Under review by Race Control. You'll get a radio call with the result.</p>}
            {c.state === 'REJECTED' && <p className="error small">Rejected: {c.reason}</p>}
            {mine.length > 0 && (
              <div className="thumbs">
                {mine.map((p, i) => (
                  <div className="thumb" key={p.url}>
                    <img src={p.url} alt={`${c.name} certificate ${i + 1}`} />
                    <button type="button" className="thumb-remove" aria-label={`Remove ${c.name} certificate ${i + 1}`}
                            onClick={() => remove(c.id, i)}>×</button>
                  </div>
                ))}
              </div>
            )}
            <input id={`proof-file-${c.id}`} type="file" accept="image/*" multiple hidden
                   onChange={(e) => onPick(c, e)} />
            <button type="button" className="btn-secondary" disabled={busy}
                    onClick={() => document.getElementById(`proof-file-${c.id}`).click()}>
              {mine.length || c.count ? 'Add another certificate' : 'Choose certificates'}
            </button>
            {c.count > 0 && <p className="muted small">{c.count} {c.count === 1 ? 'certificate' : 'certificates'} sent today</p>}
          </div>
        )
      })}

      {categories.length > 0 && (!done || total > 0) && (
        <button type="button" className="btn-primary" disabled={!total || busy} onClick={send}>
          {busy ? 'Sending…' : total ? `Send proof (${total})` : 'Send proof'}
        </button>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  )
}
