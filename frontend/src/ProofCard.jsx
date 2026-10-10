import { useEffect, useRef, useState } from 'react'
import { submitProof } from './api.js'
import { prepareImage } from './images.js'
import { lapLine } from './lap.js'
import { useNow } from './useNow.js'

const TAGS = { MISSING: 'TO DO', PENDING: 'UNDER REVIEW', APPROVED: 'APPROVED', REJECTED: 'TO REDO' }

const messageFor = (err) => {
  if (err.status === 400) return "That wasn't accepted: use JPEG, PNG or WebP screenshots, and only categories on the list."
  if (err.status === 413) return 'A screenshot is too large. Try a smaller one.'
  if (err.status === 409) return "Part of that was refused: a category is already approved or at today's limit."
  if (err.status === 404) return 'We lost your team. Reload the app.'
  return "Couldn't send your proof. Check your connection and try again."
}

export default function ProofCard({ crewId, proof, onChanged, highlight = false }) {
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

  const onPick = (category, e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    const mine = picked[category.id] ?? []
    const room = Math.max(Math.min(maxPerCategory - category.count - mine.length, maxPerSubmission - total), 0)
    const added = files.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }))
    setError(files.length > room
      ? (room ? `You can add up to ${room} more here.` : 'No more screenshots can be added here right now.')
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
      const prepared = await Promise.all(items.map(async (item) => ({ ...item, file: await prepareImage(item.file) })))
      await submitProof(crewId, prepared)
      Object.values(picked).flat().forEach((p) => URL.revokeObjectURL(p.url))
      setPicked({})
      onChanged()
    } catch (err) {
      setError(messageFor(err))
      if (err.status === 409) onChanged()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="proof-card" className={`card proof ${highlight ? 'is-highlight' : ''}`}>
      <div className="proof-title">
        <div className="eyebrow">TODAY'S PROOF · KST</div>
        {done && <span className="pit-tag">ALL DONE</span>}
      </div>
      {categories.length > 0 && <p className="muted small">The proof day follows Korea time. {lapLine(now)}.</p>}
      {categories.length === 0 && (
        <p className="muted small">Race Control hasn't announced today's categories yet. Check back soon.</p>
      )}
      {categories.length > 0 && !done && (
        <p className="muted small">Vote on MNET+, then send at least one screenshot for every category.</p>
      )}
      {done && <p className="muted small">You're done for today. See you at the next lap.</p>}

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
                    <img src={p.url} alt={`${c.name} screenshot ${i + 1}`} />
                    <button type="button" className="thumb-remove" aria-label={`Remove ${c.name} screenshot ${i + 1}`}
                            onClick={() => remove(c.id, i)}>×</button>
                  </div>
                ))}
              </div>
            )}
            {c.state !== 'APPROVED' && (
              <>
                <input id={`proof-file-${c.id}`} type="file" accept="image/*" multiple hidden
                       onChange={(e) => onPick(c, e)} />
                <button type="button" className="btn-secondary" disabled={busy || c.count + mine.length >= maxPerCategory}
                        onClick={() => document.getElementById(`proof-file-${c.id}`).click()}>
                  {mine.length || c.count ? 'Add another screenshot' : 'Choose screenshots'}
                </button>
                <p className="muted small">{c.count + mine.length} of {maxPerCategory} screenshots today</p>
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
        <p className="muted small">Up to {maxPerSubmission} screenshots per send.</p>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  )
}
