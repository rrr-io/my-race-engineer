// TODO: replace accents with each Racing Team's livery
export const TEAMS = [
  { slug: 'jungwon',  member: 'Jungwon',  accent: '#6AA0FF',
    welcome: "I'm your race engineer for MAMA. The deal: when a race is on, I tell you what to vote on MNET+, you send me the original certificate, Race Control checks it. Simple. Don't make me call twice.",
    radioCheck: "Radio check. Loud and clear. From now on I call, you answer. Deal?" },
  { slug: 'jay',      member: 'Jay',      accent: '#27F4D2',
    welcome: "Race engineer on the line. During MAMA voting I call every session: what to vote on MNET+ and when. You log an original certificate as proof, Race Control verifies it, and we count every lap.",
    radioCheck: "Radio check: signal clear, five by five. You'll hear me at every Lights Out." },
  { slug: 'jake',     member: 'Jake',     accent: '#FFD23F',
    welcome: "Hey, I'm your race engineer! When MAMA voting is on, I'll tell you what to vote on MNET+. Send me an original certificate after, Race Control checks it, done. Easy.",
    radioCheck: "Radio check! Yep, I can hear you. Easy as." },
  { slug: 'sunghoon', member: 'Sunghoon', accent: '#C7B8FF',
    welcome: "I'm your race engineer for MAMA. Each voting day I tell you what to vote on MNET+. Send the original certificate as proof and Race Control checks it. I'll be with you every lap.",
    radioCheck: "Radio check. I can hear you clearly. I'll be here every day." },
  { slug: 'sunoo',    member: 'Sunoo',    accent: '#FF8A1F',
    welcome: "Hi, I'm your race engineer!! During MAMA voting I'll tell you what to vote on MNET+, you send me an original certificate as proof, and Race Control checks it. Let's win this together!",
    radioCheck: "Radio check!! I can hear you!! This is going to be so much fun!" },
  { slug: 'niki',     member: 'Ni-ki',    accent: '#FF7EB6',
    welcome: "Race engineer. I tell you what to vote on MNET+. You send the original certificate. Race Control checks it. That's it.",
    radioCheck: "Radio check. Clear." }
]

export const teamBySlug = (slug) => TEAMS.find((t) => t.slug === slug)
