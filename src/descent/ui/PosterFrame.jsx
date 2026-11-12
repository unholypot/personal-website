import { useEffect, useRef } from 'react'
import { grainPixels } from './grainTile.js'

const TILE = 160

// The paper the poster is printed on: a cream border, darkened corners, and a film of grain
// that jumps a few times a second. All plain alpha layers that never take a click.
export default function PosterFrame() {
  const grain = useRef(null)

  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = TILE
    const ctx = canvas.getContext('2d')
    if (!ctx || !grain.current) return
    ctx.putImageData(new ImageData(grainPixels(TILE), TILE, TILE), 0, 0)
    grain.current.style.backgroundImage = `url(${canvas.toDataURL()})`
  }, [])

  return (
    <div className="poster-frame" aria-hidden="true">
      <div className="vignette" />
      <div className="grain" ref={grain} />
      <div className="edge edge-top" />
      <div className="edge edge-bottom" />
      <div className="edge edge-left" />
      <div className="edge edge-right" />
    </div>
  )
}
