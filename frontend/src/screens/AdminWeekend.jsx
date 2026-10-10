import { useEffect, useState } from 'react'
import { adminRaceWeekend, createRaceEvent, deleteRaceEvent, updateRaceEvent } from '../api.js'
import { fromKstInput, kstLabel, toKstInput } from '../raceWeekend.js'

const EMPTY = { title: '', note: '', start: '', end: '' }

const messageFor = (err, fallback) => {
  if (err.status === 400) return 'Check the date: a title, an end after the start, at most 31 days long.'
  if (err.status === 404) return 'That date was already removed. The list is up to date now.'
  return fallback
}

export default function WeekendPanel({ auth, onLogout }) {
  const [events, setEvents] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(null)

  const load = () => adminRaceWeekend(auth)
    .then((r) => setEvents(r.events))
    .catch((err) => { if (err.status === 401) onLogout(); else setError("Can't load the dates.") })

  useEffect(() => { load() }, [])

  const set = (key) => (e) => { setForm({ ...form, [key]: e.target.value }); setSaved(null) }

  const startEdit = (event) => {
    setEditing(event.id)
    setForm({ title: event.title, note: event.note, start: toKstInput(event.start), end: toKstInput(event.end) })
    setError(null); setSaved(null)
    document.getElementById('weekend-form')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }

  const reset = () => { setEditing(null); setForm(EMPTY) }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true); setError(null); setSaved(null)
    const body = { title: form.title.trim(), note: form.note.trim(), start: fromKstInput(form.start), end: fromKstInput(form.end) }
    try {
      if (editing) await updateRaceEvent(auth, editing, body)
      else await createRaceEvent(auth, body)
      setSaved(editing ? 'Date updated. Calendars pick it up on their next refresh.' : 'Date added.')
      reset()
      await load()
    } catch (err) {
      if (err.status === 401) { onLogout(); return }
      setError(messageFor(err, "Couldn't save the date. Try again."))
      if (err.status === 404) { reset(); load() }
    } finally {
      setBusy(false)
    }
  }

  const remove = async (event) => {
    if (!window.confirm(`Remove "${event.title}"? It disappears from every fan's calendar on the next refresh.`)) return
    setBusy(true); setError(null); setSaved(null)
    try {
      await deleteRaceEvent(auth, event.id)
      if (editing === event.id) reset()
      setSaved('Date removed.')
    } catch (err) {
      if (err.status === 401) { onLogout(); return }
      setError(messageFor(err, "Couldn't remove the date. Try again."))
    } finally {
      setBusy(false)
      load()
    }
  }

  const ready = form.title.trim() && form.start && form.end
  const now = Date.now()

  return (
    <div className="admin-body">
      <section className="card">
        <div className="eyebrow">RACE WEEKEND</div>
        <p className="muted small">
          The dates fans add to their calendar. Enter times in Korea time (KST): each fan sees them in their own time
          zone, with a reminder from their ENGENEer 30 minutes before.
        </p>
        {events === null && !error && <p className="muted small">Loading…</p>}
        {events?.length === 0 && <p className="muted small">No dates yet.</p>}
        {events?.map((e) => (
          <div key={e.id} className="event-admin">
            <div className="event-head">
              <span className="event-title">{e.title}</span>
              {new Date(e.end).getTime() <= now && <span className="muted small">Over</span>}
            </div>
            <span className="muted small">{kstLabel(e.start)} → {kstLabel(e.end)}</span>
            {e.note && <span className="small">{e.note}</span>}
            <div className="proof-actions">
              <button type="button" className="btn-secondary" disabled={busy} onClick={() => startEdit(e)}>Edit</button>
              <button type="button" className="btn-secondary" disabled={busy} onClick={() => remove(e)}>Remove</button>
            </div>
          </div>
        ))}
      </section>

      <form className="card" id="weekend-form" onSubmit={save}>
        <div className="eyebrow">{editing ? 'EDIT DATE' : 'ADD A DATE'}</div>
        <label className="field">
          Title
          <input value={form.title} maxLength={120} onChange={set('title')} placeholder="Sprint Race · voting round 1" />
        </label>
        <label className="field">
          Note for fans (optional)
          <textarea className="textarea" rows={3} maxLength={500} value={form.note} onChange={set('note')} />
        </label>
        <label className="field">
          Starts (KST)
          <input type="datetime-local" value={form.start} onChange={set('start')} />
        </label>
        <label className="field">
          Ends (KST)
          <input type="datetime-local" value={form.end} onChange={set('end')} />
        </label>
        <button className="btn-primary" disabled={busy || !ready}>{editing ? 'Save changes' : 'Add date'}</button>
        {editing && <button type="button" className="btn-link" onClick={reset}>Cancel editing</button>}
        {saved && <p className="muted small" role="status">{saved}</p>}
      </form>

      {error && <p className="error" role="alert">{error}</p>}
      <button type="button" className="btn-link" onClick={onLogout}>Log out</button>
    </div>
  )
}
