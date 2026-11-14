// Opening camera lift, separate from scroll travel. Cancelling motion must also
// cancel the lift because the scene clock stops under reduced motion.
export function arrivalLift(run, { enabled, ready, atTop, time }) {
  if (!enabled) {
    run.arriving = false
    return 0
  }
  if (run.arriving === null) {
    if (!ready) return atTop ? 300 : 0
    run.arriving = atTop
    run.arrivalStart = time
  }
  if (!run.arriving) return 0
  const t = Math.min(1, Math.max(0, (time - run.arrivalStart) / 1.6))
  if (t === 1) run.arriving = false
  const settled = t * t * t * (t * (t * 6 - 15) + 10)
  return 300 * (1 - settled)
}
