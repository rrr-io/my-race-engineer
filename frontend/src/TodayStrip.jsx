import { lapLine, lapSoon } from './lap.js'
import { useNow } from './useNow.js'

/** What to do today, at the top of the home: progress, one main action, when the next lap starts. */
export default function TodayStrip({ radio, line, onProof }) {
  const now = useNow()
  const proof = radio?.proof
  if (!proof || proof.categories.length === 0) return null

  const { categories, done } = proof
  const count = (state) => categories.filter((c) => c.state === state).length
  const approved = count('APPROVED')
  const pending = count('PENDING')
  const missing = count('MISSING')
  const rejected = count('REJECTED')
  const total = categories.length

  let headline
  if (done) headline = 'All done for today'
  else if (missing === 0 && rejected === 0) headline = 'Waiting for Race Control'
  else headline = `${approved} of ${total} approved`

  const details = []
  if (!done && pending) details.push(`${pending} in Beta Testing`)
  if (!done && rejected) details.push(`${rejected} to redo`)

  return (
    <section className="today" aria-labelledby="today-title">
      <div className="today-top">
        <div>
          <div className="eyebrow">TODAY</div>
          <div className="today-headline" id="today-title">{headline}</div>
          {details.length > 0 && <div className="muted small">{details.join(' · ')}</div>}
        </div>
        <div className="today-meter" aria-hidden="true">
          {categories.map((c) => <span key={c.id} className={`seg is-${c.state.toLowerCase()}`} />)}
        </div>
      </div>

      {line && (
        <p className="today-radio">
          <span className="today-from">ENGINEER</span>
          <span>"{line}"</span>
        </p>
      )}

      {missing > 0 && (
        <div className="today-actions">
          {radio.voteUrl && (
            <a className="btn-action" href={radio.voteUrl} target="_blank" rel="noopener noreferrer">Open MNET+</a>
          )}
          <button type="button" className="btn-action" onClick={onProof}>Upload proof</button>
        </div>
      )}
      {missing === 0 && rejected > 0 && (
        <div className="today-actions">
          <button type="button" className="btn-action" onClick={onProof}>Redo proof</button>
        </div>
      )}

      <div className={`small ${lapSoon(now) && !done ? 'today-soon' : 'muted'}`}>{lapLine(now)}</div>
    </section>
  )
}
