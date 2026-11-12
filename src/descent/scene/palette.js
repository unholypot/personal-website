// The only colours in the piece.
export const PALETTE = {
  cream: '#F2E6CE',
  orange: '#D9532B',
  mustard: '#E3A72F',
  teal: '#2F8F8B',
  navy: '#14213D',
  ink: '#0B1220',
}

const { cream, orange, mustard, teal, navy, ink } = PALETTE

// Each material is three tones: lit, mid, shadow.
export const TONES = {
  station: [cream, mustard, navy],
  solar: [mustard, orange, navy],
  craft: [cream, orange, navy],
  dome: [cream, teal, navy],
  drone: [cream, mustard, ink],
  payload: [orange, orange, ink],
  rock: [teal, navy, ink],
  silhouette: [ink, ink, ink],
}

export function rgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)

const SPACE = rgb(navy)
const GROUND_SKY = mix(rgb(navy), rgb(teal), 0.6)

// Navy in space, turning toward teal as the surface nears.
export function skyColor(p) {
  const t = Math.min(1, Math.max(0, (p - 0.45) / 0.35))
  return mix(SPACE, GROUND_SKY, t)
}
