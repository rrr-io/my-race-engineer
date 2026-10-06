export default function Home({ team }) {
  return (
    <div className="screen home" style={{ '--accent': team.accent }}>
      <header className="home-head">
        <div>
          <div className="eyebrow">RACE ENGINEER</div>
          <div className="team-name">Team {team.member}</div>
        </div>
        {/* TODO: race phase */}
      </header>

      <main className="feed">
        <article className="radio">
          <div className="radio-label">RADIO · ENGINEER</div>
          <p className="radio-text">"{team.welcome}"</p>
        </article>
      </main>
    </div>
  )
}
