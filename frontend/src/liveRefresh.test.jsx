import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onNotificationClick, onPush } from './swPush.js'

vi.mock('./api.js', () => ({ getRadio: vi.fn() }))
const { getRadio } = await import('./api.js')
const { useRadio } = await import('./useRadio.js')

function Phase() {
  const { radio } = useRadio('crew1')
  return <p>{radio ? radio.phase : 'loading'}</p>
}

const settle = () => act(async () => { await Promise.resolve(); await Promise.resolve() })

describe('the home follows the race without waiting for the poll', () => {
  let worker
  beforeEach(() => {
    worker = new EventTarget()
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: worker })
    getRadio.mockReset()
  })
  afterEach(() => { cleanup(); delete navigator.serviceWorker })

  it('reloads when the service worker says a push arrived', async () => {
    getRadio.mockResolvedValueOnce({ phase: 'GRID' }).mockResolvedValueOnce({ phase: 'SPRINT_RACE' })
    render(<Phase />)
    await settle()
    expect(screen.getByText('GRID')).toBeTruthy()

    worker.dispatchEvent(new MessageEvent('message', { data: { type: 'refresh' } }))
    await settle()
    expect(screen.getByText('SPRINT_RACE')).toBeTruthy()
  })

  it('reloads when the app gets focus, as after tapping a notification with the app on screen', async () => {
    getRadio.mockResolvedValueOnce({ phase: 'GRAND_PRIX' }).mockResolvedValueOnce({ phase: 'FINAL_LAP' })
    render(<Phase />)
    await settle()
    window.dispatchEvent(new Event('focus'))
    await settle()
    expect(screen.getByText('FINAL_LAP')).toBeTruthy()
  })

  it('keeps the newest state when an older answer comes back late', async () => {
    let slow
    getRadio
      .mockReturnValueOnce(new Promise((resolve) => { slow = resolve }))
      .mockResolvedValueOnce({ phase: 'FINISH_LINE' })
    render(<Phase />)
    window.dispatchEvent(new Event('focus'))
    await settle()
    slow({ phase: 'GRID' })
    await settle()
    expect(screen.getByText('FINISH_LINE')).toBeTruthy()
  })

  it('ignores other messages from the service worker', async () => {
    getRadio.mockResolvedValue({ phase: 'GRID' })
    render(<Phase />)
    await settle()
    worker.dispatchEvent(new MessageEvent('message', { data: { type: 'proof' } }))
    await settle()
    expect(getRadio).toHaveBeenCalledTimes(1)
  })
})

describe('service worker', () => {
  const windowClient = () => ({ postMessage: vi.fn(), focus: vi.fn(() => Promise.resolve()) })
  const clientsWith = (...windows) => ({ matchAll: vi.fn(() => Promise.resolve(windows)), openWindow: vi.fn() })

  it('a push shows the notification and tells open windows to refresh', async () => {
    const win = windowClient()
    let done
    const event = { data: { json: () => ({ title: 'Pit stop', body: 'Box box' }) }, waitUntil: (p) => { done = p } }
    const registration = { showNotification: vi.fn(() => Promise.resolve()) }
    onPush(event, registration, clientsWith(win))
    await done
    expect(registration.showNotification).toHaveBeenCalledWith('Pit stop', expect.objectContaining({ body: 'Box box' }))
    expect(win.postMessage).toHaveBeenCalledWith({ type: 'refresh' })
  })

  it('a tap with the app open refreshes it before focusing', async () => {
    const win = windowClient()
    let done
    const event = { notification: { close: vi.fn(), data: { url: '/' } }, waitUntil: (p) => { done = p } }
    onNotificationClick(event, clientsWith(win))
    await done
    expect(win.postMessage).toHaveBeenCalledWith({ type: 'refresh' })
    expect(win.focus).toHaveBeenCalled()
  })
})
