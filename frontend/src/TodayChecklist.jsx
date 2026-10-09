import { useState } from 'react'
import { lapLine, lapSoon } from './lap.js'
import { useNow } from './useNow.js'

const LABELS = { APPROVED: 'Approved', PENDING: 'In Beta Testing', REJECTED: 'To redo', MISSING: 'To do' }

const Mark = ({ state }) => {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', 'aria-hidden': true, fill: 'none', strokeWidth: 2.2,
    strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (state === 'APPROVED') {
    return <svg {...common} stroke="var(--accent)"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M7.5 12.5l3 3 6-6.5" /></svg>
  }
  if (state === 'PENDING') {
    return <svg {...common} stroke="var(--accent)"><rect x="3" y="3" width="18" height="18" rx="3" opacity="0.5" /><path d="M12 7.5v5l3 2" /></svg>
  }
  if (state === 'REJECTED') {
    return <svg {...common} stroke="#FF9B9B"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 9l6 6M15 9l-6 6" /></svg>
  }
  return <svg {...common} stroke="#6B6F78"><rect x="3" y="3" width="18" height="18" rx="3" /></svg>
}

const Chevron = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'none' : 'rotate(180deg)' }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

/** Today's job as a checklist docked at the bottom: one line closed, every category open. */
export default function TodayChecklist({ radio, line, onProof, glow = false, demo = false }) {
  const now = useNow()
  const [open, setOpen] = useState(false)
  const proof = radio?.proof
  if (!proof || proof.categories.length === 0) return null

  const { categories, done } = proof
  const count = (state) => categories.filter((c) => c.state === state).length
  const approved = count('APPROVED')
  const missing = count('MISSING')
  const rejected = count('REJECTED')

  let summary
  if (done) summary = 'All done for today'
  else if (missing === 0 && rejected === 0) summary = 'Waiting for Race Control'
  else summary = `${approved} of ${categories.length} approved`

  const toProof = () => { setOpen(false); onProof() }

  return (
    <div className={`today-dock ${open ? 'is-open' : ''} ${glow ? 'is-glow' : ''}`}>
      {open && (
        <section className="today-panel" id="today-panel" aria-label="Today checklist">
          {line && (
            <p className="today-radio">
              <span className="today-from">ENGINEER</span>
              <span>"{line}"</span>
            </p>
          )}
          <ul className="checklist">
            {categories.map((c) => (
              <li key={c.id} className={`check-item is-${c.state.toLowerCase()}`}>
                <Mark state={c.state} />
                <span className="check-name">{c.name}</span>
                <span className="check-state">{LABELS[c.state]}</span>
              </li>
            ))}
          </ul>
          {missing > 0 && (
            <div className="today-actions">
              {radio.voteUrl && (
                <a className="btn-action" href={radio.voteUrl} target="_blank" rel="noopener noreferrer">Open MNET+</a>
              )}
              <button type="button" className="btn-action" onClick={toProof}>Upload proof</button>
            </div>
          )}
          {missing === 0 && rejected > 0 && (
            <div className="today-actions">
              <button type="button" className="btn-action" onClick={toProof}>Redo proof</button>
            </div>
          )}
        </section>
      )}
      <button type="button" className="today-bar" aria-expanded={open} aria-controls="today-panel" onClick={() => setOpen(!open)}>
        <span className="today-text">
          <span className="eyebrow">TODAY CHECKLIST</span>
          <span className="today-summary">
            <b>{summary}</b>
            {!demo && <span className={lapSoon(now) && !done ? 'today-soon' : 'muted'}> · {lapLine(now)}</span>}
          </span>
        </span>
        <span className="today-meter" aria-hidden="true">
          {categories.map((c) => <span key={c.id} className={`seg is-${c.state.toLowerCase()}`} />)}
        </span>
        <Chevron open={open} />
      </button>
    </div>
  )
}
