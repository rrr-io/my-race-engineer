import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FormationLap, { formationLapDone } from './FormationLap.jsx'
import { teamBySlug } from './teams.js'

const jake = teamBySlug('jake')

// the four real places the tour points at
function Page({ children }) {
  return (
    <>
      <article data-tour="radio">radio</article>
      <div data-tour="status">status</div>
      <div data-tour="calendar"><button type="button">Check the race calendar</button></div>
      <section data-tour="gokart">go kart</section>
      {children}
    </>
  )
}

const card = () => screen.getByRole('dialog')
const next = () => fireEvent.click(screen.getByRole('button', { name: 'Next' }))

describe('FormationLap', () => {
  beforeEach(() => localStorage.clear())
  afterEach(cleanup)

  it('walks through the four stops in the engineer\'s voice', () => {
    render(<Page><FormationLap team={jake} onClose={() => {}} /></Page>)
    expect(card().textContent).toContain('FORMATION LAP · 1/4')
    expect(card().textContent).toContain(jake.tour[0])
    next()
    expect(card().textContent).toContain(jake.tour[1])
    next()
    expect(card().textContent).toContain('TAP THE CALENDAR')
  })

  it('the calendar step is done by tapping the real calendar', () => {
    render(<Page><FormationLap team={jake} onClose={() => {}} /></Page>)
    next(); next()
    fireEvent.click(screen.getByRole('button', { name: 'Check the race calendar' }))
    expect(card().textContent).toContain('Add the race weekend to your calendar')
    expect(card().textContent).not.toContain('TAP THE CALENDAR')
  })

  it('ends on the Go Kart race and can start it', () => {
    const onPractice = vi.fn()
    const onClose = vi.fn()
    render(<Page><FormationLap team={jake} onPractice={onPractice} onClose={onClose} /></Page>)
    next(); next(); next()
    expect(card().textContent).toContain(jake.tour[3])
    fireEvent.click(screen.getByRole('button', { name: 'Start practice' }))
    expect(onPractice).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
    expect(formationLapDone()).toBe(true)
  })

  it('can be skipped, and is remembered', () => {
    const onClose = vi.fn()
    render(<Page><FormationLap team={jake} onClose={onClose} /></Page>)
    expect(formationLapDone()).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(onClose).toHaveBeenCalled()
    expect(formationLapDone()).toBe(true)
  })

  it('skips a stop that is not on the page', () => {
    render(
      <>
        <article data-tour="radio">radio</article>
        <section data-tour="gokart">go kart</section>
        <FormationLap team={jake} onClose={() => {}} />
      </>
    )
    next()
    expect(card().textContent).toContain('FORMATION LAP · 4/4')
  })

  it('every team has four lines', () => {
    ['jay', 'jake', 'sunghoon', 'sunoo', 'jungwon', 'niki']
      .forEach((slug) => expect(teamBySlug(slug).tour).toHaveLength(4))
  })
})
