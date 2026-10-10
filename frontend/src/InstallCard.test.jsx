import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import InstallCard from './InstallCard.jsx'

const setAgent = (ua) => Object.defineProperty(navigator, 'userAgent', { configurable: true, get: () => ua })
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/129 Mobile Safari/537.36'
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile Safari/604.1'

describe('InstallCard', () => {
  beforeEach(() => { localStorage.clear(); window.matchMedia = () => ({ matches: false }) })
  afterEach(cleanup)

  it('shows the menu steps on Android when Chrome has not offered its dialog', () => {
    setAgent(ANDROID)
    render(<InstallCard />)
    expect(screen.getByText(/tap the menu ⋮/)).toBeTruthy()
  })

  it("uses Chrome's own install dialog when it is offered", async () => {
    setAgent(ANDROID)
    render(<InstallCard />)
    const prompt = vi.fn()
    const event = Object.assign(new Event('beforeinstallprompt'), { prompt, userChoice: Promise.resolve({ outcome: 'accepted' }) })
    act(() => { window.dispatchEvent(event) })
    fireEvent.click(screen.getByRole('button', { name: 'Install the app' }))
    expect(prompt).toHaveBeenCalled()
  })

  it('stays quiet on iPhone, where the radio check already explains the Home Screen', () => {
    setAgent(IPHONE)
    render(<InstallCard />)
    expect(screen.queryByLabelText('Install the app')).toBeNull()
  })

  it('stays quiet once installed, or after Not now', () => {
    setAgent(ANDROID)
    window.matchMedia = () => ({ matches: true })
    const { unmount } = render(<InstallCard />)
    expect(screen.queryByLabelText('Install the app')).toBeNull()
    unmount()
    window.matchMedia = () => ({ matches: false })
    render(<InstallCard />)
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
    expect(screen.queryByLabelText('Install the app')).toBeNull()
  })
})
