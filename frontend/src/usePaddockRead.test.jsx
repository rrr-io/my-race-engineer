import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePaddockRead } from './usePaddockRead.js'

const MESSAGES = [
  { from: 'ENGINEER', kind: 'BRIEFING', text: 'Vote on MNET+' },
  { from: 'PADDOCK', kind: 'CHANT', id: 7, text: 'Kim Sunoo! ENHYPEN!' },
  { from: 'PADDOCK', kind: 'MESSAGE', id: 8, text: '1000 proofs today!' }
]

function Feed({ messages = MESSAGES }) {
  const { isHidden } = usePaddockRead('crew1', messages)
  return messages.filter((m) => !isHidden(m)).map((m) => (
    <p key={m.text} data-paddock-id={m.from === 'PADDOCK' ? m.id : undefined}>{m.text}</p>
  ))
}

// the fan "sees" an announcement when the observer reports it on screen
let onScreen
class FakeObserver {
  constructor(callback) { onScreen = (text) => callback([{ isIntersecting: true, target: screen.getByText(text) }]) }
  observe() {}
  disconnect() {}
}

let visibility = 'visible'
const goAway = (minutes) => {
  visibility = 'hidden'; act(() => { document.dispatchEvent(new Event('visibilitychange')) })
  vi.setSystemTime(Date.now() + minutes * 60 * 1000)
  visibility = 'visible'; act(() => { document.dispatchEvent(new Event('visibilitychange')) })
}
const shown = (text) => screen.queryByText(text) !== null

describe('usePaddockRead', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', FakeObserver)
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(Date.parse('2026-10-10T12:00:00Z'))
  })
  afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); vi.useRealTimers() })

  it('shows every announcement the first time', () => {
    render(<Feed />)
    expect(shown('Kim Sunoo! ENHYPEN!')).toBe(true)
    expect(shown('1000 proofs today!')).toBe(true)
  })

  it('hides what was read on the next opening, keeps what was never on screen', () => {
    render(<Feed />)
    act(() => onScreen('Kim Sunoo! ENHYPEN!'))
    expect(shown('Kim Sunoo! ENHYPEN!')).toBe(true) // nothing vanishes under the fan's eyes
    cleanup()

    render(<Feed />)
    expect(shown('Kim Sunoo! ENHYPEN!')).toBe(false)
    expect(shown('1000 proofs today!')).toBe(true)
    expect(shown('Vote on MNET+')).toBe(true) // only Paddock announcements are read-once
  })

  it('a quick trip to MNET+ keeps the feed as it is, a long absence clears what was read', () => {
    render(<Feed />)
    act(() => onScreen('1000 proofs today!'))
    goAway(2)
    expect(shown('1000 proofs today!')).toBe(true)
    goAway(11)
    expect(shown('1000 proofs today!')).toBe(false)
  })

  it('forgets announcements the server no longer sends', () => {
    render(<Feed />)
    act(() => onScreen('Kim Sunoo! ENHYPEN!'))
    cleanup()
    render(<Feed messages={MESSAGES.filter((m) => m.id !== 7)} />)
    expect(JSON.parse(localStorage.getItem('e1.paddockRead.crew1'))).toEqual([])
  })
})
