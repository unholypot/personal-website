import { useEffect } from 'react'
import { damp, nearestStop, scrollToProgress, STOP_COUNT } from './progress.js'

const read = () =>
  scrollToProgress(window.scrollY, document.documentElement.scrollHeight, window.innerHeight)

// The progress store: { current: smoothed p, target: raw p }. It lives outside React and is
// read every frame by the camera and the captions, so scrolling never re-renders anything.
export const createProgress = () => ({ current: 0, target: 0 })

// One loop turns the page's scroll position into the smoothed value. Returns a stop function.
export function runProgress(progress, { reducedMotion = false } = {}) {
  const snap = (p) => nearestStop(p) / (STOP_COUNT - 1)
  progress.target = read()
  // Start where the page already is: no glide down from the top after a reload.
  progress.current = reducedMotion ? snap(progress.target) : progress.target

  let raf = 0
  let last = performance.now()
  const tick = (now) => {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now
    progress.target = read()
    progress.current = reducedMotion ? snap(progress.target) : damp(progress.current, progress.target, dt)
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}

export function useScrollProgress(progress, { reducedMotion = false } = {}) {
  useEffect(() => runProgress(progress, { reducedMotion }), [progress, reducedMotion])
}
