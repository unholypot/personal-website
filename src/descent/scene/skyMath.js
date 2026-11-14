// Small bits of vector maths for laying things out on the far sky, where everything is a
// direction (a point on the unit sphere) and never a place.
const DEG = Math.PI / 180

// A direction from azimuth and elevation, in degrees. Azimuth 0 is straight ahead on the way
// down (the -z direction) and positive turns to the right.
export const sky = (azimuth, elevation) => {
  const a = azimuth * DEG
  const e = elevation * DEG
  return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)]
}

export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

export const unit = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}

// Two directions square to d and to each other, for laying things out round d.
export const frame = (d) => {
  const side = unit(cross(d, [0, 1, 0]))
  return [side, cross(side, d)]
}

// The direction x to the side and y up from d, in the plane tangent to it (x and y are close to radians).
export const offset = (d, [side, up], x, y) =>
  unit([d[0] + side[0] * x + up[0] * y, d[1] + side[1] * x + up[1] * y, d[2] + side[2] * x + up[2] * y])
