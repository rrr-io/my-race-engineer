import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LivePanel from './AdminLive.jsx'
import { getRace, previewRace, setRace } from '../api.js'

vi.mock('../api.js', () => ({ getRace: vi.fn(), previewRace: vi.fn(), setRace: vi.fn() }))

const race = (over = {}) => ({ phase: 'GRID', pitStop: false, practice: false, ...over })
const open = async (state) => {
  getRace.mockResolvedValue(state)
  previewRace.mockResolvedValue({ pushEnabled: true, devices: 3, from: 'ENGINEER', lines: [] })
  render(<LivePanel auth={{ user: 'a', password: 'b' }} onLogout={() => {}} />)
  return {
    pit: await screen.findByRole('switch', { name: /PIT STOP/ }),
    practice: screen.getByRole('switch', { name: /FREE PRACTICE/ })
  }
}

describe('Race Control · Live', () => {
  afterEach(cleanup)

  it('shows pit stop and free practice as switches, both off on the Grid', async () => {
    const { pit, practice } = await open(race())
    expect(pit.getAttribute('aria-checked')).toBe('false')
    expect(practice.getAttribute('aria-checked')).toBe('false')
    expect(pit.disabled).toBe(false)
    expect(practice.disabled).toBe(false)
  })

  it('free practice starts only from the Grid', async () => {
    const { practice } = await open(race({ phase: 'SPRINT_RACE' }))
    expect(practice.disabled).toBe(true)
    expect(screen.getByText(/starts from the Grid/)).toBeTruthy()
  })

  it('during free practice, phases and pit stops are locked', async () => {
    const { pit, practice } = await open(race({ practice: true }))
    expect(practice.getAttribute('aria-checked')).toBe('true')
    expect(pit.disabled).toBe(true)
    screen.getAllByRole('radio').forEach((phase) => expect(phase.disabled).toBe(true))
  })

  it('during a pit stop, the switch shows it and free practice waits', async () => {
    const { pit, practice } = await open(race({ phase: 'SPRINT_RACE', pitStop: true }))
    expect(pit.getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText('ON · RACE PAUSED')).toBeTruthy()
    expect(practice.disabled).toBe(true)
  })

  it('flipping a switch asks first, and it moves only once saved', async () => {
    const { practice } = await open(race())
    setRace.mockResolvedValue(race({ practice: true }))
    fireEvent.click(practice)
    expect(await screen.findByText('Start free practice?')).toBeTruthy()
    expect(practice.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(await screen.findByRole('button', { name: 'Start free practice' }))
    await waitFor(() => expect(practice.getAttribute('aria-checked')).toBe('true'))
    expect(setRace).toHaveBeenCalledWith({ user: 'a', password: 'b' }, { practice: true })
  })
})
