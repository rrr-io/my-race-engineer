import { proofSummary } from './proofSummary.js'

export default function CurrentAction({ radio, onProof }) {
  let title = 'Connecting to Race Control…'
  let detail = 'Your next action will appear here.'
  const racing = radio && !radio.pitStop && ['SPRINT_RACE', 'GRAND_PRIX', 'FINAL_LAP'].includes(radio.phase)
  const { counts, text } = proofSummary(radio?.proof?.categories)
  if (radio?.pitStop) { title = 'Pit Stop — wait for Race Control'; detail = 'Submissions are paused. We will show your next action when the race resumes.' }
  else if (radio?.phase === 'GRID') { title = 'Get ready for Lights Out'; detail = 'No vote is requested yet. Check the Race Weekend schedule or try Free Practice.' }
  else if (radio?.phase === 'FINISH_LINE') { title = 'You reached the Finish Line'; detail = 'Voting activities are complete. Follow Race Control for results and the Podium Ceremony.' }
  else if (racing) {
    if (counts.REJECTED) { title = 'Correct your proof'; detail = 'Read the rejection reason, then send the correct certificate.' }
    else if (counts.MISSING) { title = 'Vote, then send your proof'; detail = 'Already voted? Go straight to your proof. Save the original certificate.' }
    else if (counts.PENDING) { title = 'Your proof is with Race Control'; detail = 'No new upload is needed. You can leave the app and check again later.' }
    else if (counts.APPROVED) { title = 'All done for today'; detail = 'Your proofs are approved. Follow Race Control for the next voting session.' }
    else { title = 'Waiting for voting categories'; detail = 'Race Control has not published the categories yet.' }
  }
  return (
    <section className="card" aria-labelledby="next-action-title">
      <div className="eyebrow">YOUR NEXT ACTION</div>
      <h1 id="next-action-title">{title}</h1>
      <p>{detail}</p>
      {racing && text && <p className="muted small" role="status">{text}</p>}
      {racing && (counts.MISSING > 0 || counts.REJECTED > 0) && (
        <div className="msg-actions">
          {counts.MISSING > 0 && radio.voteUrl && <a className="btn-action" href={radio.voteUrl} target="_blank" rel="noopener noreferrer">Open MNET+</a>}
          <button type="button" className="btn-action" onClick={onProof}>{counts.REJECTED ? 'Review correction' : 'Send proof'}</button>
        </div>
      )}
    </section>
  )
}
