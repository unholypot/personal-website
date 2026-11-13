import { CHARTS } from '../descent/content/starCharts.js'
import { chartOffsets } from '../descent/scene/starChart.js'

const W = 150
const H = 120
const PAD = 12

// One real constellation, drawn flat: its stars joined by the lines astronomers use. It is the same
// chart the descent's sky is made from. Decorative, so hidden from assistive technology.
export default function ConstellationFigure({ chart }) {
  const data = CHARTS[chart]
  if (!data) return null
  const offsets = chartOffsets(data.stars)
  const spanX = Math.max(...offsets.map((p) => p.x)) - Math.min(...offsets.map((p) => p.x)) || 1
  const spanY = Math.max(...offsets.map((p) => p.y)) - Math.min(...offsets.map((p) => p.y)) || 1
  const scale = Math.min((W - 2 * PAD) / spanX, (H - 2 * PAD) / spanY)
  const brightest = Math.min(...data.stars.map((s) => s.mag))
  const at = new Map(data.stars.map((s, i) => [s.name, [W / 2 + offsets[i].x * scale, H / 2 - offsets[i].y * scale]]))

  return (
    <svg className="figure" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      {data.links.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={at.get(a)[0]} y1={at.get(a)[1]} x2={at.get(b)[0]} y2={at.get(b)[1]} />
      ))}
      {data.stars.map((s) => (
        <circle key={s.name} className={s.mag === brightest ? 'bright' : undefined} cx={at.get(s.name)[0]} cy={at.get(s.name)[1]} r={Math.max(1.4, 3.4 - s.mag * 0.55)} />
      ))}
    </svg>
  )
}
