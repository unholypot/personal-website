import { useEffect } from 'react'

// Runs a small canvas drawing that turns slowly: sets the canvas up for the screen's pixel density,
// calls the drawing with the angle every frame (about 30 a second, paused while the tab is hidden),
// and draws it once, still, for anyone who prefers reduced motion.
// `makeDraw(width, height)` gets the canvas size in pixels and returns `draw(ctx, angle)`.
export function useSpin(canvas, width, height, makeDraw, speed = 0.5) {
  useEffect(() => {
    const el = canvas.current
    const ctx = el.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const [pw, ph] = [Math.round(width * dpr), Math.round(height * dpr)]
    el.setAttribute('width', String(pw))
    el.setAttribute('height', String(ph))
    const draw = makeDraw(pw, ph)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      draw(ctx, 0.9)
      return undefined
    }
    let raf = 0
    let last = 0
    let angle = 0.9
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      if (document.hidden || now - last < 33) return
      angle += ((now - last) / 1000) * speed
      last = now
      draw(ctx, angle)
    }
    raf = requestAnimationFrame((now) => {
      last = now
      tick(now)
    })
    return () => cancelAnimationFrame(raf)
  }, [canvas, width, height, makeDraw, speed])
}
