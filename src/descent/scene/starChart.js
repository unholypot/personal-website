// Turns a real star chart (right ascension and declination) into a flat figure, the way it looks
// in the sky: a gnomonic projection, which keeps straight lines straight and distances very close
// to true over a patch this size, with north up and east on the left.
const RAD = Math.PI / 180

// The true angle between two stars, in radians.
export function angularSeparation(a, b) {
  const [ra1, dec1, ra2, dec2] = [a.ra * 15 * RAD, a.dec * RAD, b.ra * 15 * RAD, b.dec * RAD]
  const h = Math.sin((dec2 - dec1) / 2) ** 2 + Math.cos(dec1) * Math.cos(dec2) * Math.sin((ra2 - ra1) / 2) ** 2
  return 2 * Math.asin(Math.sqrt(Math.min(1, h)))
}

// Where each star sits on the flat figure, in radians from its middle: x to the right, y up.
export function chartOffsets(stars) {
  const ras = stars.map((s) => s.ra * 15)
  const decs = stars.map((s) => s.dec)
  const ra0 = (((Math.min(...ras) + Math.max(...ras)) / 2) * Math.PI) / 180
  const dec0 = (((Math.min(...decs) + Math.max(...decs)) / 2) * Math.PI) / 180
  const flat = stars.map((s) => {
    const ra = s.ra * 15 * RAD
    const dec = s.dec * RAD
    const cosc = Math.sin(dec0) * Math.sin(dec) + Math.cos(dec0) * Math.cos(dec) * Math.cos(ra - ra0)
    const xi = (Math.cos(dec) * Math.sin(ra - ra0)) / cosc
    const eta = (Math.cos(dec0) * Math.sin(dec) - Math.sin(dec0) * Math.cos(dec) * Math.cos(ra - ra0)) / cosc
    // east is to the left on a chart of the sky
    return { x: -xi, y: eta }
  })
  const cx = (Math.min(...flat.map((p) => p.x)) + Math.max(...flat.map((p) => p.x))) / 2
  const cy = (Math.min(...flat.map((p) => p.y)) + Math.max(...flat.map((p) => p.y))) / 2
  return flat.map((p) => ({ x: p.x - cx, y: p.y - cy }))
}
