import { useState } from 'react'

// The page opens on the name alone, over a plain ground, while the scene warms up unseen.
// When the scene is ready this fades away and removes itself.
export default function Opening({ done }) {
  const [gone, setGone] = useState(false)
  if (gone) return null
  return (
    <div className={done ? 'opening opening-done' : 'opening'} aria-hidden="true" onTransitionEnd={() => setGone(true)}>
      <span className="opening-name">Allen Saji</span>
    </div>
  )
}
