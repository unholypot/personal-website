import { useEffect, useRef } from 'react'

// A small cue at the foot of the first screen: a chevron nodding toward the page. It is only
// shown on wide screens (a phone's first caption already says to scroll) and goes as soon as
// the visitor has started to descend. Decorative, so hidden from assistive technology.
export default function ScrollCue({ progress }) {
  const el = useRef(null)

  useEffect(() => {
    let raf = 0
    let away = false
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const gone = progress.target > 0.015
      if (gone === away || !el.current) return
      away = gone
      el.current.classList.toggle('scroll-cue-gone', gone)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progress])

  return (
    <div className="scroll-cue" ref={el} aria-hidden="true">
      <span className="scroll-cue-label">Scroll</span>
      <svg className="scroll-cue-arrow" viewBox="0 0 24 14" width="24" height="14">
        <path d="M2 2 L12 11 L22 2" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
      </svg>
    </div>
  )
}
