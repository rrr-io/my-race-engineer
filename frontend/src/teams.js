// TODO: replace accents with each Racing Team's livery
export const TEAMS = [
  { slug: 'jungwon',  member: 'Jungwon',  accent: '#6AA0FF',
    welcome: "Welcome aboard. I'll tell you what to do and when. You just show up. Deal?",
    calendarLine: "Put these in your calendar. I'll handle the rest. Just be on time, okay?" },
  { slug: 'jay',      member: 'Jay',      accent: '#27F4D2',
    welcome: "Radio check. I'm your engineer for this race. I call the laps, you bring the votes.",
    calendarLine: "Session schedule. Sync it so you never miss a start, every lap counts." },
  { slug: 'jake',     member: 'Jake',     accent: '#FFD23F',
    welcome: "Hey, welcome to the crew! I'll give you a shout when it's time. Easy as.",
    calendarLine: "Pop these in your calendar, no stress. I'll ping you before each one." },
  { slug: 'sunghoon', member: 'Sunghoon', accent: '#C7B8FF',
    welcome: "Welcome. I'll keep you on track every day. You won't race alone.",
    calendarLine: "Add these dates. I'll remind you before each one, you won't miss anything." },
  { slug: 'sunoo',    member: 'Sunoo',    accent: '#FF8A1F',
    welcome: "Welcome to the team! I'm your engineer and I'm already so happy you're here!",
    calendarLine: "Our race weekend!! Add it to your calendar so we're always together!" },
  { slug: 'niki',     member: 'Ni-ki',    accent: '#FF7EB6',
    welcome: "You're here. Good. I'll call you when it's time.",
    calendarLine: "Dates. Add them." }
]

export const teamBySlug = (slug) => TEAMS.find((t) => t.slug === slug)
