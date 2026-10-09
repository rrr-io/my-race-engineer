export function proofSummary(categories = []) {
  const counts = Object.fromEntries(['MISSING', 'PENDING', 'APPROVED', 'REJECTED'].map((state) =>
    [state, categories.filter((category) => category.state === state).length]))
  const labels = { MISSING: 'to send', PENDING: 'in review', APPROVED: 'approved', REJECTED: 'to correct' }
  return { counts, text: Object.entries(counts).filter(([, count]) => count > 0)
    .map(([state, count]) => `${count} ${labels[state]}`).join(' · ') }
}
