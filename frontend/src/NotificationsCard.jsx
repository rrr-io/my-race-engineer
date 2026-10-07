import { usePush } from './usePush.js'

export default function NotificationsCard({ crewId }) {
  const { status, busy, error, enable, disable } = usePush(crewId)

  if (status === 'loading' || status === 'hidden') return null

  if (status === 'on') {
    return (
      <div className="notify-row">
        <span>Radio calls are on</span>
        <button type="button" className="btn-link" onClick={disable} disabled={busy}>Turn off</button>
      </div>
    )
  }
  if (status === 'unsupported') {
    return <p className="notify-note">This browser can't receive radio calls.</p>
  }
  if (status === 'blocked') {
    return (
      <p className="notify-note">
        Notifications are blocked for this app. Turn them on in your phone or browser settings, then reload.
      </p>
    )
  }

  const install = status === 'install'
  return (
    <section className="notify">
      <article className="radio">
        <div className="radio-label">RADIO · ENGINEER</div>
        <p className="radio-text">
          {install
            ? '"To get my radio calls on iPhone, add this app to your Home Screen first."'
            : '"Want me to call you on the radio when a phase starts?"'}
        </p>
      </article>
      {install ? (
        <>
          <ol className="steps">
            <li>Open this page in Safari.</li>
            <li>Tap Share, then Add to Home Screen.</li>
            <li>Open the app from your Home Screen and turn on radio calls there.</li>
          </ol>
          <p className="notify-note">Needs iOS 16.4 or later.</p>
        </>
      ) : (
        <button type="button" className="btn-primary" onClick={enable} disabled={busy}>
          Turn on radio calls
        </button>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  )
}
