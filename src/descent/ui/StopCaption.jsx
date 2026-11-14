import { useEffect, useRef } from 'react'
import { captionVisibility } from '../scroll/progress.js'

// The words for one stop, set like a poster caption. It fades in when its subject comes on
// screen and out when it leaves (the stop's `window`); while hidden it cannot be focused or clicked. With `fixed` it
// simply stays put and visible, for the plain page shown when there is no scene.
export default function StopCaption({ stop, index, progress, fixed = false }) {
  const el = useRef(null)

  useEffect(() => {
    if (fixed) return
    let raf = 0
    let shown = -1
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const v = captionVisibility(progress.current, stop.window)
      if (v === shown || !el.current) return
      shown = v
      el.current.style.opacity = String(v)
      el.current.style.transform = `translateY(${(1 - v) * 16}px)`
      el.current.style.visibility = v === 0 ? 'hidden' : 'visible'
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [fixed, stop, progress])

  const Title = index === 0 ? 'h1' : 'h2'

  return (
    <article className="caption" ref={el} id={stop.id} style={fixed ? undefined : { opacity: 0, visibility: 'hidden' }}>
      <Title className="caption-title">{stop.title}</Title>
      <div className="caption-body">
        <p className="caption-kicker">{stop.kicker}</p>
        <p>{stop.body}</p>
      </div>
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
