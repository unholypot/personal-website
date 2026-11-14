// Adaptive quality: when scrolling runs slow, lower the render resolution rather than drop frames.
// It only ever steps down during a visit.
export function createQuality({ maxDpr, levels = [2, 1.5, 1], slowMs = 20, window = 45 }) {
  const usable = levels.filter((l) => l <= maxDpr)
  const steps = usable.length ? usable : [1]
  let index = 0
  let samples = []

  return {
    level: () => steps[index],
    sample(frameMs, moving) {
      if (!moving || index >= steps.length - 1) return steps[index]
      samples.push(frameMs)
      if (samples.length > window) samples.shift()
      if (samples.length === window) {
        const mean = samples.reduce((a, b) => a + b, 0) / window
        if (mean > slowMs) {
          index++
          samples = []
        }
      }
      return steps[index]
    },
  }
}
