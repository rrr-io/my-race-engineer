// The proof day follows Korea time (UTC+9, no daylight saving): a new voting day starts at midnight KST.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const SOON_MS = 60 * 60 * 1000

/** The next midnight in Korea, as a Date. */
export function nextLap(now = Date.now()) {
  const kstDay = Math.floor((now + KST_OFFSET_MS) / DAY_MS)
  return new Date((kstDay + 1) * DAY_MS - KST_OFFSET_MS)
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })

/** "New voting day at 17:00 your time", or "New voting day in 42 min" during the last hour. */
export function lapLine(now = Date.now()) {
  const next = nextLap(now)
  const left = next.getTime() - now
  if (left <= SOON_MS) {
    const minutes = Math.max(1, Math.ceil(left / 60000))
    return `New voting day in ${minutes} min`
  }
  return `New voting day at ${timeFmt.format(next)} your time`
}

export const lapSoon = (now = Date.now()) => nextLap(now).getTime() - now <= SOON_MS
