import { useEffect, useRef, useState } from 'react'
import { SKILLS } from '../../content/skills.js'
import { canExplore, nearestFigure, nearestStar } from '../scene/constellations.js'
import { starInfo } from '../content/starInfo.js'
import { figures, skyStore } from '../scene/skyStore.js'

// How far outside a figure's own edge the pointer still counts as being on it.
const SLACK = 34
// How close the pointer must be to a single star for it to be named.
const STAR_SLACK = 13

// Lets the constellations be explored. A mouse hovers over one and a finger taps it (a tap, or a
// click, pins it until the next tap); the one in focus lights up in the sky and a label names
// the skill. A small hint says the constellations can be explored, until the first is found.
// Decorative for assistive technology: the same text is in the skill list.
export default function SkyLabels({ progress }) {
  const [shown, setShown] = useState(-1) // which skill's words are in the label
  const [star, setStar] = useState(null) // the star being named: { figure, star }
  const label = useRef(null)
  const tip = useRef(null)
  const ring = useRef(null)
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

      // a single star under a mouse is named; fingers do not hover, so phones never see this
      const found = open && hovering && pointer && skyStore.active >= 0 ? nearestStar(screens, pointer.x, pointer.y, STAR_SLACK) : null
      const was = skyStore.star
      if ((found?.figure ?? -1) !== (was?.figure ?? -1) || (found?.star ?? -1) !== (was?.star ?? -1)) {
        skyStore.star = found
        setStar(found)
      }
      if (found && tip.current && ring.current) {
        const p = screens[found.figure].stars[found.star]
        const el = tip.current
        const margin = 12
        let x = p.x + 16
        if (x + el.offsetWidth + margin > window.innerWidth) x = p.x - 16 - el.offsetWidth
        const y = Math.max(margin, Math.min(window.innerHeight - el.offsetHeight - margin, p.y + 14))
        el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
        ring.current.style.transform = `translate3d(${Math.round(p.x)}px, ${Math.round(p.y)}px, 0)`
      }
      tip.current?.classList.toggle('sky-star-on', !!found)
      ring.current?.classList.toggle('sky-star-on', !!found)

      const el = label.current
      const a = skyStore.active
      if (el) {
        if (a >= 0) {
          const s = screens[a]
          const width = el.offsetWidth
          const margin = 16
          let x
          let y
          if (window.innerHeight > window.innerWidth) {
            // a tall phone screen has no room beside a figure, and a card there would cover it: the card
            // stays in the open sky between the figures and the caption, centred, so the figure stays in view
            x = (window.innerWidth - width) / 2
            y = Math.min(window.innerHeight - el.offsetHeight - margin, window.innerHeight * 0.54)
          } else {
            // beside the figure, on whichever side has room
            const right = s.x + s.r + 14
            x = right + width + margin < window.innerWidth ? right : s.x - s.r - 14 - width
            x = Math.max(margin, Math.min(window.innerWidth - width - margin, x))
            y = Math.max(margin, Math.min(window.innerHeight - el.offsetHeight - margin, s.y - 20))
          }
          el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
        }
        // while one star is being named, its own card takes over from the figure's
        el.classList.toggle('sky-label-on', a >= 0 && !found)
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
      skyStore.star = null
    }
  }, [progress])

  const skill = SKILLS[shown]
  const info = star ? starInfo(figures[star.figure].chart, star.star) : null

  return (
    <>
      <p className="sky-hint" ref={hint} aria-hidden="true">
        Each constellation is a set of my skills.{' '}
        <span className="sky-hint-mouse">Hover over one.</span>
        <span className="sky-hint-touch">Tap one.</span>
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
      <span className="sky-star-ring" ref={ring} aria-hidden="true" />
      <aside className="sky-star" ref={tip} aria-hidden="true">
        {info && (
          <>
            <p className="sky-star-name">{info.name}</p>
            <p className="sky-star-of">In {info.constellation}</p>
            {info.note && <p className="sky-star-note">{info.note}</p>}
          </>
        )}
      </aside>
    </>
  )
}
