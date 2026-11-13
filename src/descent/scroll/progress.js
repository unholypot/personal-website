// Pure scroll maths. Progress p runs from 0 (top of the page) to 1 (bottom).

export const STOP_COUNT = 5

const clamp01 = (v) => (v > 0 ? (v < 1 ? v : 1) : 0)

export function scrollToProgress(scrollY, scrollHeight, viewportHeight) {
  const max = scrollHeight - viewportHeight
  if (!(max > 0)) return 0
  return clamp01(scrollY / max)
}

// Time-based smoothing: the same result whatever the frame rate.
export function damp(current, target, dt, tau = 0.18) {
  if (tau <= 0) return target
  if (!(dt > 0)) return current
  return current + (target - current) * (1 - Math.exp(-dt / tau))
}

export function nearestStop(p, count = STOP_COUNT) {
  if (!(p > 0)) return 0
  return Math.min(count - 1, Math.round(p * (count - 1)))
}

// How visible a caption is at p, given its window [fadeInStart, shown, fadeOutStart, gone].
export function captionVisibility(p, [fadeIn, shown, fadeOut, gone]) {
  if (!(p >= 0)) return 0
  if (p >= shown && p <= fadeOut) return 1
  if (p > fadeIn && p < shown) return (p - fadeIn) / (shown - fadeIn)
  if (p > fadeOut && p < gone) return (gone - p) / (gone - fadeOut)
  return 0
}
