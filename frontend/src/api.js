const CREW_KEY = 'e1.crewId'

export const storedCrewId = () => {
  try { return localStorage.getItem(CREW_KEY) } catch { return null }
}
export const storeCrewId = (id) => {
  try { localStorage.setItem(CREW_KEY, id) } catch { /* no storage */ }
}
export const clearCrewId = () => {
  try { localStorage.removeItem(CREW_KEY) } catch { /* ignore */ }
}

async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

export const createCrew = (team) =>
  request('/crew', { method: 'POST', body: JSON.stringify({ team }) })

export const getCrew = (id) => request(`/crew/${id}`)
