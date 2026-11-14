// Smooth lines on the far sky. Each line is a thin ribbon (two triangles) lying across the sky, soft
// at its edges in the shader, so it is a clean hairline and not a stepped one-pixel line. Drawing a
// figure in is done by growing the ribbons: each one runs from its start toward its end as the
// reveal advances, one after the other, so the line seems to be drawn by a moving pen.
// Pure maths; the sky material and the frame loop live elsewhere.

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const unit = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}

export const VERTICES_PER_SEGMENT = 6

// Which side of its line each vertex is on (-1 or +1), for the soft edge. The same for every frame.
export function ribbonSides(count) {
  const out = new Float32Array(count * VERTICES_PER_SEGMENT)
  const one = [-1, 1, 1, -1, 1, -1] // a-, a+, b+ , a-, b+, b-
  for (let i = 0; i < out.length; i++) out[i] = one[i % VERTICES_PER_SEGMENT]
  return out
}

// How much of segment `k` of `count` is drawn when the whole figure is `reveal` (0 to 1) drawn.
export const segmentFraction = (reveal, k, count) => Math.min(1, Math.max(0, reveal * count - k))

// Fills `out` (count * 6 * 3 numbers) with the ribbons for `segments` ([[from, to], ...], unit
// directions) at the given reveal. `halfWidth` is in radians of sky. A segment not yet reached is
// collapsed to nothing.
export function fillRibbons(out, segments, reveal, halfWidth) {
  const n = segments.length
  let o = 0
  segments.forEach(([a, b], k) => {
    const frac = segmentFraction(reveal, k, n)
    const w = frac > 0 ? halfWidth : 0
    const end = unit([a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac, a[2] + (b[2] - a[2]) * frac])
    const side = unit(cross(unit([a[0] + b[0], a[1] + b[1], a[2] + b[2]]), sub(b, a)))
    const A = (s) => [a[0] + side[0] * w * s, a[1] + side[1] * w * s, a[2] + side[2] * w * s]
    const B = (s) => [end[0] + side[0] * w * s, end[1] + side[1] * w * s, end[2] + side[2] * w * s]
    for (const p of [A(-1), A(1), B(1), A(-1), B(1), B(-1)]) {
      out[o++] = p[0]
      out[o++] = p[1]
      out[o++] = p[2]
    }
  })
  return out
}
