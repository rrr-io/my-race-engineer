import { describe, expect, it } from 'vitest'
import { lapLine, lapShort, lapSoon, nextLap } from './lap.js'

// 22:00 in Korea (KST = UTC+9): the next lap is at midnight KST, 15:00 UTC
const AT_22_KST = Date.parse('2026-10-10T13:00:00Z')

describe('lap', () => {
  it('starts the next lap at midnight Korea time', () => {
    expect(nextLap(AT_22_KST).toISOString()).toBe('2026-10-10T15:00:00.000Z')
  })

  it('right after midnight KST, the next lap is a full day away', () => {
    expect(nextLap(Date.parse('2026-10-10T15:00:01Z')).toISOString()).toBe('2026-10-11T15:00:00.000Z')
  })

  it('counts down in minutes during the last hour', () => {
    const now = Date.parse('2026-10-10T14:30:00Z')
    expect(lapSoon(now)).toBe(true)
    expect(lapLine(now)).toBe('New lap in 30 min')
    expect(lapShort(now)).toBe('New lap in 30 min')
  })

  it('shows a clock time when the lap is more than an hour away', () => {
    expect(lapSoon(AT_22_KST)).toBe(false)
    expect(lapLine(AT_22_KST)).toMatch(/^New lap at .+ your time$/)
    expect(lapShort(AT_22_KST)).toMatch(/^New lap at /)
  })
})
