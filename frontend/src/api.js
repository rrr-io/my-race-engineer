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
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData
  const res = await fetch(`/api${path}`, {
    headers: isForm ? { ...headers } : { 'Content-Type': 'application/json', ...headers },
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
export const submitProof = (crewId, items) => {
  const form = new FormData()
  items.forEach(({ file, categoryId }) => {
    form.append('files', file, file.name || 'screenshot.jpg')
    form.append('categoryIds', String(categoryId))
  })
  return request(`/crew/${crewId}/proofs`, { method: 'POST', body: form })
}
export const adminProofs = (auth) => request('/admin/proofs', { headers: basic(auth) })
export const approveProof = (auth, id) =>
  request(`/admin/proofs/${id}/approve`, { method: 'POST', headers: basic(auth) })
export const rejectProof = (auth, id, reason) =>
  request(`/admin/proofs/${id}/reject`, { method: 'POST', headers: basic(auth), body: JSON.stringify({ reason }) })
export async function fetchProofImage(auth, id) {
  const res = await fetch(`/api/admin/proofs/${id}/image`, { headers: basic(auth) })
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.blob()
}

export const adminCategories = (auth) => request('/admin/categories', { headers: basic(auth) })
export const putCategories = (auth, names) =>
  request('/admin/categories', { method: 'PUT', headers: basic(auth), body: JSON.stringify({ names }) })

export const adminReminders = (auth) => request('/admin/reminders', { headers: basic(auth) })
export const putReminders = (auth, settings) =>
  request('/admin/reminders', { method: 'PUT', headers: basic(auth), body: JSON.stringify(settings) })
export const runReminders = (auth) => request('/admin/reminders/run', { method: 'POST', headers: basic(auth) })

export const adminPush = (auth) => request('/admin/push', { headers: basic(auth) })
export const sendTestPush = (auth) =>
  request('/admin/push/test', { method: 'POST', headers: basic(auth) })
