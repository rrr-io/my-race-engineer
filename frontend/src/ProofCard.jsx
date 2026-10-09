import { useEffect, useRef, useState } from 'react'
import { submitProof } from './api.js'
import { validateOriginalCertificate } from './images.js'
import { lapLine } from './lap.js'
import { useNow } from './useNow.js'

const TAGS = { MISSING: 'TO DO', PENDING: 'IN BETA TESTING', APPROVED: 'APPROVED', REJECTED: 'TO REDO' }

const messageFor = (err) => {
  if (err.status === 423) return 'Submissions are paused. Your selected files are kept here; wait for Race Control to resume.'
  if (err.status === 400) return "That wasn't accepted: use JPEG, PNG or WebP certificates, and only categories on the list."
  if (err.status === 413) return 'The upload is too large. Originals must be at most 8 MB each; send fewer files together.'
  if (err.status === 409) return "Part of that was refused: a category is already approved or at today's limit."
  if (err.status === 404) return 'We lost your team. Reload the app.'
  return "Couldn't send your proof. Check your connection and try again."
}

export default function ProofCard({ crewId, proof, onChanged, highlight = false, demo = false, onSubmit }) {
  const [picked, setPicked] = useState({})
  const [busy, setBusy] = useState(false)
  const now = useNow()
  const [error, setError] = useState(null)
  const latest = useRef(picked)
  latest.current = picked

  useEffect(() => () => Object.values(latest.current).flat().forEach((p) => URL.revokeObjectURL(p.url)), [])

  if (!proof) return null
  const { categories, done, maxPerSubmission, maxPerCategory } = proof
  const total = Object.values(picked).flat().length

  const onPick = async (category, e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    if (!demo) {
      setBusy(true)
      try { await Promise.all(files.map(validateOriginalCertificate)) }
      catch (err) { setError(err.message); return }
      finally { setBusy(false) }
    }
    const mine = picked[category.id] ?? []
    const room = Math.max(Math.min((category.remaining ?? maxPerCategory - category.count) - mine.length, maxPerSubmission - total), 0)
    const added = files.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }))
    setError(files.length > room
      ? (room ? `You can add up to ${room} more here.` : 'No more certificates can be added here right now.')
      : null)
    setPicked((current) => ({ ...current, [category.id]: [...(current[category.id] ?? []), ...added] }))
  }

  const remove = (categoryId, index) => {
    URL.revokeObjectURL(picked[categoryId][index].url)
    setPicked((current) => ({ ...current, [categoryId]: current[categoryId].filter((_, i) => i !== index) }))
    setError(null)
  }

  const send = async () => {
    setBusy(true); setError(null)
    try {
      const items = categories.flatMap((c) => (picked[c.id] ?? []).map((p) => ({ categoryId: c.id, file: p.file })))
      if (!demo && items.reduce((bytes, item) => bytes + item.file.size, 0) > 39 * 1024 * 1024) {
        setError('Send fewer certificates together (up to 39 MB per upload). Keep the originals unedited.')
        return
      }
      const prepared = demo ? items : await Promise.all(items.map(async (item) => ({ ...item, file: await validateOriginalCertificate(item.file) })))
      if (onSubmit) await onSubmit(prepared)
      else await submitProof(crewId, prepared)
      Object.values(picked).flat().forEach((p) => URL.revokeObjectURL(p.url))
      setPicked({})
      onChanged()
    } catch (err) {
      setError(messageFor(err))
      if (err.status === 409 || err.status === 423) onChanged()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="proof-card" className={`card proof ${highlight ? 'is-highlight' : ''}`}>
      <div className="proof-title">
        <div className="eyebrow">{demo ? 'PRACTICE PROOF · SIMULATED' : "TODAY'S PROOF · KST"}</div>
        {done && <span className="pit-tag">ALL DONE</span>}
      </div>
      {!demo && categories.length > 0 && <p className="muted small">The proof day follows Korea time. {lapLine(now)}.</p>}
      {categories.length === 0 && (
        <p className="muted small">Race Control hasn't announced today's categories yet. Check back soon.</p>
      )}
      {categories.length > 0 && !done && (
        <p className="muted small">{demo ? 'Use the sample certificate below. No real vote or upload is needed.' : 'Vote on MNET+, then send the original, unedited certificate for every category (JPEG, PNG or WebP, up to 8 MB each).'}</p>
      )}
      {done && <p className="muted small">You're done for today. Follow Race Control for the next voting session.</p>}

      {categories.map((c) => {
        const mine = picked[c.id] ?? []
        const remaining = c.remaining ?? Math.max(0, maxPerCategory - c.count)
        return (
          <div className="category" key={c.id}>
            <div className="category-head">
              <strong>{c.name}</strong>
              <span className="pit-tag">{TAGS[c.state]}</span>
            </div>
            {c.state === 'PENDING' && <p className="muted small">In review by Race Control. You'll get a radio call with the result.</p>}
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
            {c.state !== 'APPROVED' && (
              <>
                <input id={`proof-file-${c.id}`} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={busy}
                       onChange={(e) => onPick(c, e)} />
                <button type="button" className="btn-secondary" disabled={busy || mine.length >= remaining || (demo && c.state === 'PENDING')}
                        onClick={() => demo ? onPick(c, { target: { files: [sampleCertificate()], value: '' } })
                          : document.getElementById(`proof-file-${c.id}`).click()}>
                  {demo ? 'Use sample certificate' : mine.length || c.count ? 'Add another certificate' : 'Choose certificates'}
                </button>
                <p className="muted small">{c.count} sent today · {Math.max(0, remaining - mine.length)} available upload slots</p>
                {!demo && <p className="muted small">Up to {maxPerCategory} pending proofs and {2 * maxPerCategory} total attempts per category per day, including corrections.</p>}
                {remaining === 0 && c.state === 'REJECTED' && <p className="error small">Today's correction limit is reached. Contact Race Control through your team's usual channel before trying again.</p>}
              </>
            )}
          </div>
        )
      })}

      {categories.length > 0 && !done && (
        <button type="button" className="btn-primary" disabled={!total || busy} onClick={send}>
          {busy ? 'Sending…' : total ? `Send proof (${total})` : 'Send proof'}
        </button>
      )}
      {categories.length > 0 && !done && total > 0 && (
        <p className="muted small">Up to {maxPerSubmission} certificates per send.</p>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  )
}

function sampleCertificate() {
  return new File([`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360">
    <rect width="600" height="360" fill="#20232d"/>
    <text x="40" y="130" fill="white" font-size="32">FREE PRACTICE</text>
    <text x="40" y="200" fill="#b5f6cd" font-size="24">Sample certificate</text>
    <text x="40" y="270" fill="white" font-size="20">DEMO ONLY · NOT A REAL VOTE</text>
  </svg>`], 'practice-sample.svg', { type: 'image/svg+xml' })
}
