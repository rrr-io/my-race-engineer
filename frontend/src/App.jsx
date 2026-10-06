import { useEffect, useState } from 'react'
import { clearCrewId, createCrew, getCrew, storeCrewId, storedCrewId } from './api.js'
import { teamBySlug } from './teams.js'
import Onboarding from './screens/Onboarding.jsx'
import Home from './screens/Home.jsx'

export default function App() {
  const [crew, setCrew] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const id = storedCrewId()
    if (!id) { setStatus('onboarding'); return }
    getCrew(id)
      .then((c) => { setCrew(c); setStatus('ready') })
      .catch((e) => {
        if (e.status === 404) { clearCrewId(); setStatus('onboarding') }
        else setStatus('offline')
      })
  }, [])

  const join = async (slug) => {
    const c = await createCrew(slug)
    storeCrewId(c.id)
    setCrew(c)
    setStatus('ready')
  }

  if (status === 'loading') return <div className="screen center muted">Connecting to the pit wall…</div>
  if (status === 'offline') {
    return (
      <div className="screen center">
        <p>Can't reach the pit wall. Check your connection and try again.</p>
        <button className="btn-primary" onClick={() => location.reload()}>Try again</button>
      </div>
    )
  }
  if (status === 'onboarding') return <Onboarding onJoin={join} />
  return <Home team={teamBySlug(crew.team)} />
}
