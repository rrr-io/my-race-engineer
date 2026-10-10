import { useCallback, useEffect, useState } from 'react'
import { clearCrewId, createCrew, getCrew, storeCrewId, storedCrewId, storeTeam, storedTeam } from './api.js'
import { teamBySlug } from './teams.js'
import Onboarding from './screens/Onboarding.jsx'
import Home from './screens/Home.jsx'
import RadioCheck from './screens/RadioCheck.jsx'
import Splash from './Splash.jsx'

export default function App() {
  const [crew, setCrew] = useState(null)
  const [status, setStatus] = useState('loading')
  // the splash runs only for a fan we already know, until their home has its first data
  const [splash, setSplash] = useState(() => !!storedCrewId())
  const [homeReady, setHomeReady] = useState(false)
  const [splashTeam] = useState(() => teamBySlug(storedTeam()) ?? null)

  useEffect(() => {
    const id = storedCrewId()
    if (!id) { setStatus('onboarding'); return }
    getCrew(id)
      .then((c) => { storeTeam(c.team); setCrew(c); setStatus('ready') })
      .catch((e) => {
        if (e.status === 404) { clearCrewId(); setSplash(false); setStatus('onboarding') }
        else setStatus('offline')
      })
  }, [])

  const homeLoaded = useCallback(() => setHomeReady(true), [])
  const splashDone = useCallback(() => setSplash(false), [])

  const join = async (slug) => {
    const c = await createCrew(slug)
    storeCrewId(c.id)
    storeTeam(c.team)
    setCrew(c)
    setStatus('radio')
  }

  const radioDone = useCallback(() => setStatus('ready'), [])

  let screen = null
  if (status === 'onboarding') screen = <Onboarding onJoin={join} />
  else if (status === 'radio') screen = <RadioCheck team={teamBySlug(crew.team)} crewId={crew.id} onDone={radioDone} />
  else if (status === 'ready') screen = <Home team={teamBySlug(crew.team)} crewId={crew.id} onReady={homeLoaded} />

  // same position in the tree whatever the screen, so the splash keeps its lights while the home mounts below it
  return (
    <>
      {screen}
      {(splash || status === 'offline') && (
        <Splash team={splashTeam} ready={status === 'ready' && homeReady} failed={status === 'offline'} onDone={splashDone} />
      )}
    </>
  )
}
