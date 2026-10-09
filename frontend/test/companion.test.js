import test from 'node:test'
import assert from 'node:assert/strict'
import { validateOriginalCertificate, MAX_CERTIFICATE_BYTES } from '../src/images.js'
import { nextLap, lapLine } from '../src/lap.js'
import { proofSummary } from '../src/proofSummary.js'
import { practiceProof, PRACTICE_STAGES } from '../src/practiceFlow.js'

test('original PNG bytes and object are preserved', async () => {
  const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 255, 12])
  const file = new Blob([bytes], { type: 'image/png' })
  assert.equal(await validateOriginalCertificate(file), file)
  assert.deepEqual(new Uint8Array(await file.arrayBuffer()), bytes)
})
test('false MIME type and oversized originals are rejected', async () => {
  await assert.rejects(validateOriginalCertificate(new Blob(['not an image'], { type: 'image/png' })), /original JPEG/)
  await assert.rejects(validateOriginalCertificate({ size: MAX_CERTIFICATE_BYTES + 1 }), /8 MB/)
})
test('voting day switches at midnight KST, not a mass-voting lap', () => {
  const before = Date.parse('2026-10-09T14:59:00Z')
  assert.equal(nextLap(before).toISOString(), '2026-10-09T15:00:00.000Z')
  assert.equal(lapLine(before), 'New voting day in 1 min')
  assert.equal(nextLap(Date.parse('2026-10-09T15:00:00Z')).toISOString(), '2026-10-10T15:00:00.000Z')
})
test('summary distinguishes missing, pending, approved and rejected', () => {
  assert.equal(proofSummary(['MISSING', 'PENDING', 'APPROVED', 'REJECTED'].map(state => ({ state }))).text,
    '1 to send · 1 in review · 1 approved · 1 to correct')
})
test('demo states are independent and include paused and final stages', () => {
  const approved = practiceProof('APPROVED')
  const untouched = practiceProof()
  assert.equal(approved.done, true)
  assert.equal(untouched.done, false)
  assert.equal(untouched.categories[0].state, 'MISSING')
  assert.ok(PRACTICE_STAGES.some(stage => stage.pitStop && !stage.action))
  assert.equal(PRACTICE_STAGES.at(-1).phase, 'FINISH_LINE')
})
