import RadioHead from './RadioHead.jsx'
import { useInstall } from './install.js'

/** On Android, the ENGENEer offers to sit on the Home Screen: Chrome's own dialog when it allows it, else the steps. */
export default function InstallCard() {
  const { show, canPrompt, install, dismiss } = useInstall()
  if (!show) return null
  return (
    <section className="notify" aria-label="Install the app">
      <article className="radio">
        <RadioHead />
        <p className="radio-text">"Put me on your Home Screen: I'll open like an app, one tap away when the lights go out."</p>
      </article>
      {canPrompt ? (
        <button type="button" className="btn-primary" onClick={install}>Install the app</button>
      ) : (
        <ol className="steps">
          <li>In Chrome, tap the menu ⋮ at the top right.</li>
          <li>Tap Install app (on some phones: Add to Home screen, then Install).</li>
          <li>On Samsung Internet: menu ≡, Add page to, Home screen.</li>
        </ol>
      )}
      <button type="button" className="btn-link" onClick={dismiss}>Not now</button>
    </section>
  )
}
