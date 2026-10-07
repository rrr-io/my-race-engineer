export const PHASES = [
  { key: 'GRID',          label: 'Grid',          blurb: 'Waiting for lights out' },
  { key: 'SPRINT_RACE',   label: 'Sprint Race',   blurb: 'MAMA voting · round 1' },
  { key: 'GRAND_PRIX',    label: 'Grand Prix',    blurb: 'MAMA voting · round 2' },
  { key: 'FINAL_LAP',     label: 'Final Lap',     blurb: 'MAMA live voting · final' },
  { key: 'FINISH_LINE',   label: 'Finish Line',   blurb: 'The race is over' }
]

export const phaseInfo = (key) => PHASES.find((p) => p.key === key) ?? PHASES[0]
