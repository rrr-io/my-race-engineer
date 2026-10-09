// This state machine has no API or storage dependencies. Leaving practice discards it.
export const PRACTICE_STAGES = [
  { phase: 'GRID', title: 'Your place on the Grid', text: 'You are Pit Crew. Your ENHYPEN member is the Driver, represented by a Racing Team. Race Control coordinates the campaign. Lights Out marks the start.', action: false },
  { phase: 'SPRINT_RACE', title: 'Lights Out · Sprint Race', text: 'Round 1: vote, save the certificate, send proof. Here you will use a sample. Beta Testing is the review step; this demo approves automatically.', action: true },
  { phase: 'SPRINT_RACE', pitStop: true, title: 'Pit Stop', text: 'Pause for team coordination. Uploads are paused too. Wait for Race Control to resume; you do not need to vote again.', action: false },
  { phase: 'GRAND_PRIX', title: 'Grand Prix · Round 2', text: 'Follow the new round instructions. You can simulate a rejected certificate here and practise correcting it.', action: true },
  { phase: 'FINAL_LAP', title: 'Final Lap · Live voting', text: 'Follow Race Control’s live voting window. A Lap is a mass-voting session; multiple sessions can happen in one day. The daily KST reset is a different event.', action: true },
  { phase: 'FINISH_LINE', title: 'Finish Line', text: 'The race is complete. The Podium contains the top three teams; the Podium Ceremony celebrates the final results. Follow official announcements for the P1 campaign goal.', action: false }
]

export function practiceProof(state = 'MISSING') {
  return {
    day: 'DEMO', done: state === 'APPROVED', needsAction: ['MISSING', 'REJECTED'].includes(state),
    maxPerSubmission: 1, maxPerCategory: 5, latestProofId: null,
    categories: [{ id: 1, name: 'Practice category', state, count: state === 'MISSING' ? 0 : 1,
      reason: state === 'REJECTED' ? 'Example: wrong certificate. Choose the sample again to correct it.' : null }]
  }
}
