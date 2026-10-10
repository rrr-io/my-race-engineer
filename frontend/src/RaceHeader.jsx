import { phaseInfo } from './phases.js'

export const Headset = ({ size = 24, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
    <rect x="3" y="13" width="4" height="7" rx="1.5" />
    <rect x="17" y="13" width="4" height="7" rx="1.5" />
    <path d="M19 20c0 1.6-2.2 2.5-5.5 2.5" />
  </svg>
)

const RACING = ['SPRINT_RACE', 'GRAND_PRIX', 'FINAL_LAP']

/** What the race is doing right now, shown on the right of the stage name. */
function raceStatus(radio) {
  if (radio.pitStop) return { kind: 'pit', label: 'PIT STOP' }
  if (radio.practice) return { kind: 'practice', label: 'FREE PRACTICE' }
  if (RACING.includes(radio.phase)) return { kind: 'live', label: 'LIVE' }
  if (radio.phase === 'FINISH_LINE') return { kind: 'finished', label: 'FINISHED' }
  return { kind: 'waiting', label: 'WAITING FOR LIGHTS OUT' }
}

/** App bar, livery stripe, team and race status. */
export default function RaceHeader({ team, radio }) {
  const status = radio ? raceStatus(radio) : null
  return (
    <header className="race-head">
      <div className="app-bar">
        <Headset size={30} />
        <div>
          <div className="app-name">RACE ENGENEer</div>
          <div className="app-sub">PERSONAL PIT WALL</div>
        </div>
      </div>
      <div className="livery-stripe" aria-hidden="true"><span /><span /></div>
      <div className="team-row">
        <div className="team-badge" aria-hidden="true">{team.badge}</div>
        <div className="team-text">
          <div className="team-title">TEAM {team.member.toUpperCase()}</div>
          <div className="team-livery">{team.livery.toUpperCase()}</div>
        </div>
      </div>
      {status && (
        <div className="race-status">
          <span>{phaseInfo(radio.phase).label.toUpperCase()}</span>
          <span className={`status is-${status.kind}`}><span className="status-mark" aria-hidden="true" />{status.label}</span>
        </div>
      )}
    </header>
  )
}
