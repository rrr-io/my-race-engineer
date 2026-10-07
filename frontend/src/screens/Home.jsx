import { useRadio } from '../useRadio.js'
import NotificationsCard from '../NotificationsCard.jsx'
import ProofCard from '../ProofCard.jsx'
import { phaseInfo } from '../phases.js'

export default function Home({ team, crewId }) {
  const { radio, offline, reload } = useRadio(crewId)
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

      {offline && (
        <div className="offline-row" role="status">
          Can't reach the pit wall. Showing the last known state.
        </div>
      )}

      {phase && (
        <div className="status-row">
          <span>{phase.blurb}</span>
          <span className="tags">
            {radio.practice && <span className="pit-tag">FREE PRACTICE</span>}
            {radio.pitStop && <span className="pit-tag">PIT STOP</span>}
          </span>
        </div>
      )}

      <main className="feed">
        <article className="radio">
          <div className="radio-label">RADIO · ENGINEER</div>
          <p className="radio-text">"{team.welcome}"</p>
        </article>

        <NotificationsCard crewId={crewId} />

        {radio?.messages.map((m, i) => (
          <article className="radio" key={i}>
            <div className={`radio-label ${m.from === 'RACE_CONTROL' ? 'is-control' : ''}`}>
              {m.from === 'RACE_CONTROL' ? 'RADIO · RACE CONTROL' : 'RADIO · ENGINEER'}
            </div>
            <p className="radio-text">"{m.text}"</p>
          </article>
        ))}

        <ProofCard crewId={crewId} proof={radio?.proof} onChanged={reload} />
      </main>
    </div>
  )
}
