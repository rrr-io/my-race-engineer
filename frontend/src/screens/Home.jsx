import { useRadio } from '../useRadio.js'
import { phaseInfo } from '../phases.js'

export default function Home({ team, crewId }) {
  const radio = useRadio(crewId)
  const phase = radio ? phaseInfo(radio.phase) : null

  return (
    <div className="screen home" style={{ '--accent': team.accent }}>
      <header className="home-head">
        <div>
          <div className="eyebrow">RACE ENGINEER</div>
          <div className="team-name">Team {team.member}</div>
        </div>
        {phase && <span className="phase-pill">{phase.label.toUpperCase()}</span>}
      </header>

      {phase && (
        <div className="status-row">
          <span>{phase.blurb}</span>
          {radio.pitStop && <span className="pit-tag">PIT STOP</span>}
        </div>
      )}

      <main className="feed">
        <article className="radio">
          <div className="radio-label">RADIO · ENGINEER</div>
          <p className="radio-text">"{team.welcome}"</p>
        </article>

        {radio?.messages.map((m, i) => (
          <article className="radio" key={i}>
            <div className={`radio-label ${m.from === 'RACE_CONTROL' ? 'is-control' : ''}`}>
              {m.from === 'RACE_CONTROL' ? 'RADIO · RACE CONTROL' : 'RADIO · ENGINEER'}
            </div>
            <p className="radio-text">"{m.text}"</p>
          </article>
        ))}
      </main>
    </div>
  )
}
