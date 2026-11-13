import { useEffect, useRef, useState } from 'react'
import { SKILLS } from '../../content/skills.js'
import { canExplore, nearestFigure } from '../scene/constellations.js'
import { figures, skyStore } from '../scene/skyStore.js'

// How far outside a figure's own edge the pointer still counts as being on it.
const SLACK = 34

// Lets the constellations be explored. A mouse hovers over one and a finger taps it (a tap, or a
// click, pins it until the next tap); the one in focus lights up in the sky and a label names
// the skill. A small hint says the constellations can be explored, until the first is found.
// Decorative for assistive technology: the same text is in the skill list.
export default function SkyLabels({ progress }) {
  const [shown, setShown] = useState(-1) // which skill's words are in the label
  const label = useRef(null)
  const hint = useRef(null)

  useEffect(() => {
    let raf = 0
    let pointer = null // last place the mouse was, if it is not over a control
    let hovering = false // whether the last pointer was a mouse or pen (hover works)
    let pinned = false

    const setActive = (i) => {
      skyStore.active = i
      if (i >= 0) {
        skyStore.discovered = true
        setShown(i)
      }
    }

    const onMove = (e) => {
      hovering = e.pointerType !== 'touch'
      pointer = e.target.closest?.('a, button') ? null : { x: e.clientX, y: e.clientY }
    }
    const onDown = (e) => {
      hovering = e.pointerType !== 'touch'
    }
    const onClick = (e) => {
      if (e.target.closest?.('a, button') || !canExplore(progress.target)) return
      const i = nearestFigure(skyStore.screen, e.clientX, e.clientY, SLACK)
      if (i >= 0 && !(pinned && skyStore.active === i)) {
        pinned = true
        setActive(i)
      } else {
        pinned = false
        setActive(-1)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        pinned = false
        setActive(-1)
      }
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const screens = skyStore.screen
      const open = canExplore(progress.target)
      // once scrolling starts, everything lets go and nothing responds
      if (!open && (pinned || skyStore.active >= 0)) {
        pinned = false
        setActive(-1)
      }
      // a pinned figure that has scrolled out of view lets go
      if (pinned && (skyStore.active < 0 || !screens[skyStore.active].visible)) {
        pinned = false
        setActive(-1)
      }
      if (open && !pinned) {
        const i = hovering && pointer ? nearestFigure(screens, pointer.x, pointer.y, SLACK) : -1
        if (i !== skyStore.active) setActive(i)
      }

      const el = label.current
      const a = skyStore.active
      if (el) {
        if (a >= 0) {
          const s = screens[a]
          const width = el.offsetWidth
          const margin = 16
          // beside the figure, on whichever side has room
          const right = s.x + s.r + 14
          let x = right + width + margin < window.innerWidth ? right : s.x - s.r - 14 - width
          x = Math.max(margin, Math.min(window.innerWidth - width - margin, x))
          const y = Math.max(margin, Math.min(window.innerHeight - el.offsetHeight - margin, s.y - 20))
          el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
        }
        el.classList.toggle('sky-label-on', a >= 0)
      }
      if (hint.current) hint.current.classList.toggle('sky-hint-gone', skyStore.discovered || !open)
      document.documentElement.style.cursor = a >= 0 ? 'pointer' : ''
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('click', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.cursor = ''
      skyStore.active = -1
    }
  }, [progress])

  const skill = SKILLS[shown]

  return (
    <>
      <p className="sky-hint" ref={hint} aria-hidden="true">
        Each constellation is a set of my skills. Hover or tap one.
      </p>
      <aside className="sky-label" ref={label} aria-hidden="true">
        {skill && (
          <>
            <p className="sky-label-kicker">{figures[shown].name}</p>
            <h2 className="sky-label-title">{skill.name}</h2>
            <div className="sky-label-body">
              <p className="sky-label-tagline">{skill.tagline}</p>
              <p className="sky-label-items">{skill.items.join(', ')}</p>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
