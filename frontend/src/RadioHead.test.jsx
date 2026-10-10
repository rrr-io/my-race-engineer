import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import RadioHead, { ago } from './RadioHead.jsx'

const NOW = Date.parse('2026-10-10T12:00:00Z')
const before = (ms) => new Date(NOW - ms).toISOString()
const MIN = 60 * 1000

describe('ago', () => {
  it('reads like a radio log', () => {
    expect(ago(before(MIN), NOW)).toBe('JUST NOW')
    expect(ago(before(12 * MIN), NOW)).toBe('12 MIN AGO')
    expect(ago(before(3 * 60 * MIN), NOW)).toBe('3H AGO')
    expect(ago(before(30 * 60 * MIN), NOW)).toBe('YESTERDAY')
    expect(ago(before(4 * 24 * 60 * MIN), NOW)).toBe('4 DAYS AGO')
  })

  it('has nothing to say about a broken date', () => {
    expect(ago('not a date', NOW)).toBeNull()
  })
})

describe('RadioHead', () => {
  it('labels who is talking', () => {
    const { rerender } = render(<RadioHead from="RACE_CONTROL" />)
    expect(screen.getByText('RADIO · RACE CONTROL')).toBeTruthy()
    rerender(<RadioHead from="PADDOCK" kind="CHANT" />)
    expect(screen.getByText('RADIO · FANCHANT')).toBeTruthy()
    rerender(<RadioHead from="PADDOCK" kind="MESSAGE" />)
    expect(screen.getByText('RADIO · ENGENEer')).toBeTruthy()
  })
})
