import { useEffect, useRef, useState } from 'react'
import ProofCard from '../ProofCard.jsx'
import TodayChecklist from '../TodayChecklist.jsx'
import { PRACTICE_STAGES, practiceProof } from '../practiceFlow.js'

export default function FreePractice({ team, onExit }) {
  const [step, setStep] = useState(0)
  const [proof, setProof] = useState(() => practiceProof())
  const [rejectOnce, setRejectOnce] = useState(false)
  const heading = useRef(null)
  const stage = PRACTICE_STAGES[step]
  const pending = proof.categories[0].state === 'PENDING'

  useEffect(() => { heading.current?.focus() }, [step])
  useEffect(() => {
    if (!pending) return undefined
    const timer = setTimeout(() => {
      setProof(practiceProof(rejectOnce ? 'REJECTED' : 'APPROVED'))
      setRejectOnce(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [pending, rejectOnce, step])

  const next = () => {
    setProof(practiceProof()); setRejectOnce(false)
    setStep((current) => Math.min(current + 1, PRACTICE_STAGES.length - 1))
  }
  const radio = { phase: stage.phase, pitStop: !!stage.pitStop, practice: true, proof, voteUrl: null }
  const final = step === PRACTICE_STAGES.length - 1

  return (
    <div className={`screen home ${stage.action ? 'has-dock' : ''}`} style={{ '--accent': team.accent }}>
      <header className="home-head">
        <div><div className="eyebrow">FREE PRACTICE · PERSONAL DEMO</div><div className="team-name">Team {team.member}</div></div>
        <button type="button" className="btn-link" onClick={onExit}>Exit practice</button>
      </header>
      <main className="feed">
        <section className="card" aria-labelledby="practice-title">
          <p className="muted small">Step {step + 1} of {PRACTICE_STAGES.length} · No real votes, points or notifications.</p>
          <h1 id="practice-title" ref={heading} tabIndex={-1}>{stage.title}</h1>
          <p>{stage.text}</p>
          {stage.pitStop && <span className="pit-tag">UPLOADS PAUSED</span>}
          {step === 3 && proof.categories[0].state === 'MISSING' && (
            <label className="check"><input type="checkbox" checked={rejectOnce} onChange={(e) => setRejectOnce(e.target.checked)} />Try a rejection and correction</label>
          )}
          <p role="status" aria-live="polite">
            {pending ? 'Beta Testing: automatic demo review in progress…' : proof.done ? 'Approved. You can continue to the next stage.' : ''}
          </p>
          {final ? <button className="btn-primary" onClick={onExit}>Return to my race</button> : (
            <button className="btn-secondary" onClick={next}>{stage.action && !proof.done ? 'Skip this step' : 'Next stage'}</button>
          )}
        </section>
        {stage.action && <ProofCard key={step} demo proof={proof} onSubmit={async () => setProof(practiceProof('PENDING'))} onChanged={() => {}} />}
        <details className="card">
          <summary>Race vocabulary</summary>
          <p><strong>Team Radio:</strong> your team chant. The companion’s engineer messages guide your next action.</p>
          <p><strong>Paddock Announcers:</strong> fanbases posting live updates. <strong>Race Weekend:</strong> the scheduled period of official activities.</p>
          <p>All stages here are simulated. Real approvals remain with Race Control.</p>
        </details>
      </main>
      {stage.action && <TodayChecklist radio={radio} line="Practice checklist: send the sample and watch its review status." onProof={() => document.getElementById('proof-card')?.scrollIntoView({ block: 'start' })} demo />}
    </div>
  )
}
