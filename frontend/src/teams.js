// Each Racing Team's livery: accent (main colour), second (stripe), onAccent (text on the accent), name and badge.
export const TEAMS = [
  { slug: 'jungwon',  member: 'Jungwon',  accent: '#13A8A0', second: '#C4C8CE', onAccent: '#0E0F12',
    livery: 'Meowcedes', badge: 'JW',
    welcome: "I'm your race engineer for MAMA. The deal: when a race is on, I tell you what to vote on MNET+, you send me the screenshot, Race Control checks it. Simple. Don't make me call twice.",
    radioCheck: "Radio check. Loud and clear. From now on I call, you answer. Deal?" },
  { slug: 'jay',      member: 'Jay',      accent: '#FFD400', second: '#E8002D', onAccent: '#0E0F12',
    livery: 'JayBull Racing', badge: 'JY',
    welcome: "Race engineer on the line. During MAMA voting I call every session: what to vote on MNET+ and when. You log a screenshot as proof, Race Control verifies it, and we count every lap.",
    radioCheck: "Radio check: signal clear, five by five. You'll hear me at every Lights Out." },
  { slug: 'jake',     member: 'Jake',     accent: '#FF8000', second: '#47C7FC', onAccent: '#0E0F12',
    livery: 'McJakey', badge: 'JK',
    welcome: "Hey, I'm your race engineer! When MAMA voting is on, I'll tell you what to vote on MNET+. Send me a screenshot after, Race Control checks it, done. Easy.",
    radioCheck: "Radio check! Yep, I can hear you. Easy as." },
  { slug: 'sunghoon', member: 'Sunghoon', accent: '#E10600', second: '#FFD12E', onAccent: '#FFFFFF',
    livery: 'Hoonrari', badge: 'SH',
    welcome: "I'm your race engineer for MAMA. Each voting day I tell you what to vote on MNET+. Send the screenshot as proof and Race Control checks it. I'll be with you every lap.",
    radioCheck: "Radio check. I can hear you clearly. I'll be here every day." },
  { slug: 'sunoo',    member: 'Sunoo',    accent: '#F06BB4', second: '#4A9EEA', onAccent: '#0E0F12',
    livery: 'Alpinoo', badge: 'SN',
    welcome: "Hi, I'm your race engineer!! During MAMA voting I'll tell you what to vote on MNET+, you send me a screenshot as proof, and Race Control checks it. Let's win this together!",
    radioCheck: "Radio check!! I can hear you!! This is going to be so much fun!" },
  { slug: 'niki',     member: 'Ni-ki',    accent: '#0B8040', second: '#CEDC00', onAccent: '#FFFFFF',
    livery: 'Rikston Drift', badge: 'NK',
    welcome: "Race engineer. I tell you what to vote on MNET+. You send the screenshot. Race Control checks it. That's it.",
    radioCheck: "Radio check. Clear." }
]

/** CSS variables that paint a screen in the team's livery. */
export const teamStyle = (t) => ({ '--accent': t.accent, '--on-accent': t.onAccent, '--second': t.second })

export const teamBySlug = (slug) => TEAMS.find((t) => t.slug === slug)
