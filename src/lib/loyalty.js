// SQL доторх tier_multiplier() функцтэй ижил байх ёстой.
export const TIERS = [
  { name: 'Bronze',   min: 0,     mult: 1.0,  color: '#b8825a' },
  { name: 'Silver',   min: 1000,  mult: 1.25, color: '#9aa4b2' },
  { name: 'Gold',     min: 5000,  mult: 1.5,  color: '#e0b000' },
  { name: 'Platinum', min: 20000, mult: 2.0,  color: '#4cc9f0' },
]

export function getTier(lifetime = 0) {
  let idx = 0
  TIERS.forEach((t, i) => { if (lifetime >= t.min) idx = i })
  const current = TIERS[idx]
  const next = TIERS[idx + 1] || null
  const progress = next ? (lifetime - current.min) / (next.min - current.min) : 1
  return { current, next, progress: Math.min(1, Math.max(0, progress)) }
}
