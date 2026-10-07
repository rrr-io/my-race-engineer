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

async function request(path, { headers, ...options } = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...headers },
    ...options
  })
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.status === 204 ? null : res.json()
}

export const createCrew = (team) =>
  request('/crew', { method: 'POST', body: JSON.stringify({ team }) })

export const getCrew = (id) => request(`/crew/${id}`)
export const getRadio = (id) => request(`/crew/${id}/radio`)
export const getRace = () => request('/race')

const basic = ({ user, password }) => ({
  Authorization: 'Basic ' + btoa(String.fromCharCode(...new TextEncoder().encode(`${user}:${password}`)))
})

export const adminCheck = (auth) => request('/admin/session', { headers: basic(auth) })
export const setRace = (auth, body) =>
  request('/admin/race', { method: 'PUT', headers: basic(auth), body: JSON.stringify(body) })

export const getPushKey = () => request('/push/key')
export const savePush = (crewId, subscription) =>
  request(`/crew/${crewId}/push`, { method: 'POST', body: JSON.stringify(subscription) })
export const deletePush = (crewId, endpoint) =>
  request(`/crew/${crewId}/push?endpoint=${encodeURIComponent(endpoint)}`, { method: 'DELETE' })
export const adminPush = (auth) => request('/admin/push', { headers: basic(auth) })
export const sendTestPush = (auth) =>
  request('/admin/push/test', { method: 'POST', headers: basic(auth) })
