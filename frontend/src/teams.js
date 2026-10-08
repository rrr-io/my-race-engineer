// TODO: replace accents with each Racing Team's livery
export const TEAMS = [
  { slug: 'jungwon',  member: 'Jungwon',  accent: '#6AA0FF',
    welcome: "I'm your race engineer for MAMA. The deal: when a race is on, I tell you what to vote on MNET+, you send me the screenshot, Race Control checks it. Simple. Don't make me call twice.",
    calendarLine: "Put these in your calendar. I'll handle the rest. Just be on time, okay?",
    radioCheck: "Radio check. Loud and clear. From now on I call, you answer. Deal?" },
  { slug: 'jay',      member: 'Jay',      accent: '#27F4D2',
    welcome: "Race engineer on the line. During MAMA voting I call every session: what to vote on MNET+ and when. You log a screenshot as proof, Race Control verifies it, and we count every lap.",
    calendarLine: "Session schedule. Sync it so you never miss a start, every lap counts.",
    radioCheck: "Radio check: signal clear, five by five. You'll hear me at every Lights Out." },
  { slug: 'jake',     member: 'Jake',     accent: '#FFD23F',
    welcome: "Hey, I'm your race engineer! When MAMA voting is on, I'll tell you what to vote on MNET+. Send me a screenshot after, Race Control checks it, done. Easy.",
    calendarLine: "Pop these in your calendar, no stress. I'll ping you before each one.",
    radioCheck: "Radio check! Yep, I can hear you. Easy as." },
  { slug: 'sunghoon', member: 'Sunghoon', accent: '#C7B8FF',
    welcome: "I'm your race engineer for MAMA. Each voting day I tell you what to vote on MNET+. Send the screenshot as proof and Race Control checks it. I'll be with you every lap.",
    calendarLine: "Add these dates. I'll remind you before each one, you won't miss anything.",
    radioCheck: "Radio check. I can hear you clearly. I'll be here every day." },
  { slug: 'sunoo',    member: 'Sunoo',    accent: '#FF8A1F',
    welcome: "Hi, I'm your race engineer!! During MAMA voting I'll tell you what to vote on MNET+, you send me a screenshot as proof, and Race Control checks it. Let's win this together!",
    calendarLine: "Our race weekend!! Add it to your calendar so we're always together!",
    radioCheck: "Radio check!! I can hear you!! This is going to be so much fun!" },
  { slug: 'niki',     member: 'Ni-ki',    accent: '#FF7EB6',
    welcome: "Race engineer. I tell you what to vote on MNET+. You send the screenshot. Race Control checks it. That's it.",
    calendarLine: "Dates. Add them.",
    radioCheck: "Radio check. Clear." }
]

export const teamBySlug = (slug) => TEAMS.find((t) => t.slug === slug)
