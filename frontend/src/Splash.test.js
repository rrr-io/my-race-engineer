import { afterEach, describe, expect, it, vi } from 'vitest'
import { rememberSeen, splashMode } from './Splash.jsx'

const NOW = Date.parse('2026-10-10T12:00:00Z')
const seenAgo = (ms) => localStorage.setItem('e1.lastSeen', String(NOW - ms))

describe('splashMode', () => {
  afterEach(() => { localStorage.clear(); vi.useRealTimers() })

  it('shows the start lights the very first time', () => {
    expect(splashMode()).toBe('lights')
  })

  it('shows the radio wave on a quick reopen, the lights after a long absence', () => {
    vi.useFakeTimers(); vi.setSystemTime(NOW)
    seenAgo(20 * 60 * 1000)
    expect(splashMode()).toBe('wave')
    seenAgo(5 * 60 * 60 * 1000)
    expect(splashMode()).toBe('lights')
  })

  it('remembers when the app was last on screen', () => {
    vi.useFakeTimers(); vi.setSystemTime(NOW)
    rememberSeen()
    expect(localStorage.getItem('e1.lastSeen')).toBe(String(NOW))
    expect(splashMode()).toBe('wave')
  })
})
