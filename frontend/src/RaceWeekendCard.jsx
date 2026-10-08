import { useEffect, useState } from 'react'
import { getRaceWeekend } from './api.js'
import { calendarLinks, eventWhen, isLive, localZone } from './raceWeekend.js'

const SHOWN = 4

export default function RaceWeekendCard({ team }) {
  const [events, setEvents] = useState(null)
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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(links.https)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* no clipboard: the link is still selectable below */ }
  }

  return (
    <section className="card race-weekend" aria-labelledby="race-weekend-title">
      <div className="proof-head">
        <div className="eyebrow" id="race-weekend-title">RACE WEEKEND</div>
        {zone && <span className="muted small">Your time · {zone}</span>}
      </div>
      <p className="small">"{team.calendarLine}"</p>

      {events === null && <p className="muted small">Loading the schedule…</p>}
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
      {events?.length > SHOWN && (
        <p className="muted small">+{events.length - SHOWN} more in the calendar.</p>
      )}

      <div className="cal-actions">
        <a className="btn-action" href={links.webcal}>Add to calendar</a>
        <a className="btn-action" href={links.google} target="_blank" rel="noopener noreferrer">Google Calendar</a>
        <button type="button" className="btn-action" onClick={copy}>{copied ? 'Link copied' : 'Copy link'}</button>
      </div>
      <p className="muted small">
        Subscribe once: new dates and changes from Race Control update on their own, with a heads-up 30 minutes before.
      </p>
    </section>
  )
}
