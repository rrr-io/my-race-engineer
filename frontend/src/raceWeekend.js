// Race Weekend helpers: fan-side time formatting, KST for Race Control, calendar links.

const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

/** "Sat 28 Nov · 18:00–22:00", or "Fri 20 Nov 10:00 → Fri 27 Nov 18:00", in the fan's own time zone. */
export function eventWhen(event) {
  const start = new Date(event.start)
  const end = new Date(event.end)
  if (dayKey(start) === dayKey(end)) {
    return `${dayFmt.format(start)} · ${timeFmt.format(start)}–${timeFmt.format(end)}`
  }
  return `${dayFmt.format(start)} ${timeFmt.format(start)} → ${dayFmt.format(end)} ${timeFmt.format(end)}`
}

export const isLive = (event, now = Date.now()) =>
  new Date(event.start).getTime() <= now && now < new Date(event.end).getTime()

/** The fan's time zone, shown under the dates so nobody wonders whose clock it is. */
export const localZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch { return '' }
}

const kstParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
})

/** ISO instant → value for <input type="datetime-local">, in Korea time. */
export function toKstInput(iso) {
  const p = Object.fromEntries(kstParts.formatToParts(new Date(iso)).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

/** <input type="datetime-local"> value (read as Korea time) → ISO with offset for the API. */
export const fromKstInput = (value) => `${value}+09:00`

/** "Sat 28 Nov 18:00 KST" for the admin list. */
export function kstLabel(iso) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso)) + ' KST'
}

/** Where to subscribe: webcal for Apple/Outlook, Google's add-by-URL page, and the plain https feed. */
export function calendarLinks(slug, origin = window.location.origin) {
  const https = `${origin}/api/calendar/${slug}.ics`
  const webcal = https.replace(/^https?:/, 'webcal:')
  return {
    https,
    webcal,
    google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`
  }
}
