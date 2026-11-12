import { useEffect, useRef } from 'react'
import { stopVisibility } from '../scroll/progress.js'

// The words for one stop, set like a poster caption. It fades in as the scroll reaches its
// stop and out as it leaves; while hidden it cannot be focused or clicked.
export default function StopCaption({ stop, index, progress }) {
  const el = useRef(null)

  useEffect(() => {
    let raf = 0
    let shown = -1
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const v = stopVisibility(progress.current, index)
      if (v === shown || !el.current) return
      shown = v
      el.current.style.opacity = String(v)
      el.current.style.transform = `translateY(${(1 - v) * 16}px)`
      el.current.style.visibility = v === 0 ? 'hidden' : 'visible'
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [index, progress])

  const Title = index === 0 ? 'h1' : 'h2'

  return (
    <article className="caption" ref={el} id={stop.id} style={{ opacity: 0, visibility: 'hidden' }}>
      <p className="caption-kicker">{stop.kicker}</p>
      <Title className="caption-title">{stop.title}</Title>
      <p className="caption-body">{stop.body}</p>
      {stop.links && (
        <ul className="caption-links">
          {stop.links.map((link) => (
            <li key={link.label}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
