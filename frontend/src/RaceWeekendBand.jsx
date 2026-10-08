import { useEffect, useState } from 'react'
import { getRaceWeekend } from './api.js'
import { calendarLinks, eventWhen, isLive, localZone } from './raceWeekend.js'

const SHOWN = 4

const Chevron = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
    <path d="M6 15l6-6 6 6" />
  </svg>
)

/** The Race Weekend as a band stuck to the bottom: the next date at a glance, the whole schedule on tap. */
export default function RaceWeekendBand({ team }) {
  const [events, setEvents] = useState(null)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    const load = () => getRaceWeekend().then((r) => { if (alive) setEvents(r.events) }).catch(() => {})
    load()
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { alive = false; document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  const links = calendarLinks(team.slug)
  const zone = localZone()
  const next = events?.[0]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(links.https)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* no clipboard */ }
  }

  return (
    <div className={`rw-band ${open ? 'is-open' : ''}`}>
      {open && (
        <section className="rw-panel" id="rw-panel" aria-label="Race Weekend schedule">
          <p className="small">"{team.calendarLine}"</p>
          {events?.length === 0 && (
            <p className="muted small">Race Control hasn't posted the dates yet. Subscribe now and they'll show up on their own.</p>
          )}
          {events?.length > 0 && (
            <ul className="event-list">
              {events.slice(0, SHOWN).map((e) => (
                <li key={e.id} className="event">
                  <div className="event-head">
                    <span className="event-title">{e.title}</span>
                    {isLive(e) && <span className="pit-tag">LIVE</span>}
                  </div>
                  <span className="muted small">{eventWhen(e)}</span>
                  {e.note && <span className="small">{e.note}</span>}
                </li>
              ))}
            </ul>
          )}
          {events?.length > SHOWN && <p className="muted small">+{events.length - SHOWN} more in the calendar.</p>}
          {zone && <p className="muted small">Times in your time zone · {zone}</p>}
          <div className="cal-actions">
            <a className="btn-action" href={links.webcal}>Add to calendar</a>
            <a className="btn-action" href={links.google} target="_blank" rel="noopener noreferrer">Google Calendar</a>
            <button type="button" className="btn-action" onClick={copy}>{copied ? 'Link copied' : 'Copy link'}</button>
          </div>
          <p className="muted small">Subscribe once: changes update on their own, with a heads-up 30 minutes before.</p>
        </section>
      )}
      <button type="button" className="rw-bar" aria-expanded={open} aria-controls="rw-panel" onClick={() => setOpen(!open)}>
        <span className="rw-text">
          <span className="eyebrow">RACE WEEKEND</span>
          <span className="rw-next">
            {events === null && 'Loading the schedule…'}
            {events?.length === 0 && 'Dates coming soon'}
            {next && <><b>{next.title}</b> · {isLive(next) ? 'live now' : eventWhen(next)}</>}
          </span>
        </span>
        <Chevron open={open} />
      </button>
    </div>
  )
}
