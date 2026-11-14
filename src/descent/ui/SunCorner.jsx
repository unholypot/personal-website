import { useEffect, useRef } from 'react'
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// The sun, which lights everything from the upper left but is out of frame: a poster sunburst
// lying in that corner, its rays fanning out over the sky and fading, and its disc half cut off by
// the border. It turns very slowly, and goes as the descent begins. Decorative.
const RAYS = 17
const FAN = 90 // degrees: the quarter of the sunburst that is on the page

const rayPath = (i) => {
  const step = FAN / RAYS
  const a0 = (i * step * Math.PI) / 180
  // alternate wide and narrow rays, as printed sunbursts have
  const width = (i % 2 ? 0.34 : 0.62) * step
  const a1 = a0 + (width * Math.PI) / 180
  const r = 460
  return `M0 0 L${(Math.cos(a0) * r).toFixed(1)} ${(Math.sin(a0) * r).toFixed(1)} L${(Math.cos(a1) * r).toFixed(1)} ${(Math.sin(a1) * r).toFixed(1)} Z`
}

export default function SunCorner({ progress }) {
  const root = useRef(null)

  useEffect(() => {
    let raf = 0
    let shown = -1
    const tick = () => {
      raf = requestAnimationFrame(tick)
      // present for the opening, gone by the time the descent is under way
      const v = 1 - smoothstep(0.01, 0.1, progress.current)
      if (v === shown || !root.current) return
      shown = v
      root.current.style.opacity = String(v)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progress])

  return (
    <div className="sun-corner" ref={root} aria-hidden="true">
      <svg viewBox="0 0 400 400" preserveAspectRatio="xMinYMin slice">
        <defs>
          <radialGradient id="sun-fade" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="420">
            <stop offset="0" stopColor="#e3a72f" stopOpacity="0.36" />
            <stop offset="0.45" stopColor="#e3a72f" stopOpacity="0.12" />
            <stop offset="1" stopColor="#e3a72f" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="sun-rays" fill="url(#sun-fade)">
          {Array.from({ length: RAYS }, (_, i) => (
            <path key={i} d={rayPath(i)} />
          ))}
        </g>
        <circle cx="0" cy="0" r="104" fill="none" stroke="#e3a72f" strokeOpacity="0.28" strokeWidth="2" />
        <circle cx="0" cy="0" r="78" fill="#e3a72f" fillOpacity="0.6" />
        <circle cx="0" cy="0" r="52" fill="#f2e6ce" fillOpacity="0.92" />
      </svg>
    </div>
  )
}
