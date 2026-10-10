// Each Racing Team's livery: accent (main colour), second (stripe), onAccent (text on the accent), name and badge.
// tour: the engineer's four lines for the Formation Lap (radio, race status, calendar, Go Kart), in the team's voice.
export const TEAMS = [
  { slug: 'jungwon',  member: 'Jungwon',  accent: '#13A8A0', second: '#C4C8CE', onAccent: '#0E0F12',
    livery: 'Meowcedes', badge: 'JW',
    welcome: "I'm your race ENGENEer for MAMA. The deal: when a race is on, I tell you what to vote on MNET+, you send me the certificate, Race Control checks it. Simple. Don't make me call twice.",
    radioCheck: "Radio check. Loud and clear. From now on I call, you answer. Deal?",
    tour: [
      "My calls land here: what to vote, when, and how your proofs went. Keep an eye on it.",
      "Stage on the left, race status on the right. One look and you know where we are.",
      "Tap the calendar and add the race weekend to your phone. I'll still remind you, but this helps.",
      "First time? Run a Go Kart practice: every phase of the race, nothing counts. No pressure."
    ] },
  { slug: 'jay',      member: 'Jay',      accent: '#FFD400', second: '#E8002D', onAccent: '#0E0F12',
    livery: 'JayBull Racing', badge: 'JY',
    welcome: "Race ENGENEer on the line. During MAMA voting I call every session: what to vote on MNET+ and when. You log a certificate as proof, Race Control verifies it, and we count every lap.",
    radioCheck: "Radio check: signal clear, five by five. You'll hear me at every Lights Out.",
    tour: [
      "Radio channel. Every call I make lands here: what to vote, when, and the status of your proofs.",
      "Live telemetry: stage on the left, race status on the right. LIVE, PIT STOP, FINISHED.",
      "Race calendar. Tap it: every session of the race weekend, synced to your phone's calendar.",
      "Before the real lights out, do a practice run: the Go Kart race goes through every phase!"
    ] },
  { slug: 'jake',     member: 'Jake',     accent: '#FF8000', second: '#47C7FC', onAccent: '#0E0F12',
    livery: 'McJakey', badge: 'JK',
    welcome: "Hey, I'm your race ENGENEer! When MAMA voting is on, I'll tell you what to vote on MNET+. Send me a certificate after, Race Control checks it, done. Easy.",
    radioCheck: "Radio check! Yep, I can hear you. Easy as.",
    tour: [
      "So, this is the radio. I'll drop all my calls here. Chill.",
      "This line tells you what stage we're in and if we're live or in the pits. Easy.",
      "Give the calendar a tap. Race weekend straight into your phone, done.",
      "Fancy a practice lap? Go Kart race with Acorn or Potato. Doesn't count for the race, it's just for fun."
    ] },
  { slug: 'sunghoon', member: 'Sunghoon', accent: '#E10600', second: '#FFD12E', onAccent: '#FFFFFF',
    livery: 'Hoonrari', badge: 'SH',
    welcome: "I'm your race ENGENEer for MAMA. Each voting day I tell you what to vote on MNET+. Send the certificates as proof and Race Control checks it. I'll be with you every lap.",
    radioCheck: "Radio check. I can hear you clearly. I'll be here every day.",
    tour: [
      "My calls come here: what to vote, when, and what happened to your proofs.",
      "Stage and race status. If you're not sure where we are, look here.",
      "Tap the calendar and add the race weekend to your phone. It helps, trust me.",
      "If you want to try everything first, there's the Go Kart race. It's fun!"
    ] },
  { slug: 'sunoo',    member: 'Sunoo',    accent: '#F06BB4', second: '#4A9EEA', onAccent: '#0E0F12',
    livery: 'Alpinoo', badge: 'SN',
    welcome: "Hi, I'm your race ENGENEer!! During MAMA voting I'll tell you what to vote on MNET+, you send me your certificates as proof, and Race Control checks them. Let's win this together!",
    radioCheck: "Radio check!! I can hear you!! This is going to be so much fun!",
    tour: [
      "This is where I'll talk to you!! Every call, every vote, every proof, right here.",
      "And this tells you where the race is: the stage, and if we're LIVE or in a PIT STOP!",
      "Tap the calendar!! Put the race weekend in your phone so we never miss a session.",
      "Wanna try the whole race first? Go Kart with Acorn or Potato, just for practice!"
    ] },
  { slug: 'niki',     member: 'Ni-ki',    accent: '#0B8040', second: '#CEDC00', onAccent: '#FFFFFF',
    livery: 'Rikston Drift', badge: 'NK',
    welcome: "Race ENGENEer. I tell you what to vote on MNET+. You send the certificate. Race Control checks it. That's it.",
    radioCheck: "Radio check. Clear.",
    tour: [
      "My calls land here.",
      "Stage on the left. Status on the right.",
      "Calendar. Tap it, add the race weekend.",
      "Want a practice run? Go Kart. Just for fun!"
    ] }
]

/** CSS variables that paint a screen in the team's livery. */
export const teamStyle = (t) => ({ '--accent': t.accent, '--on-accent': t.onAccent, '--second': t.second })

export const teamBySlug = (slug) => TEAMS.find((t) => t.slug === slug)
