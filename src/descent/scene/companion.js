// A second, smaller craft that comes down beside the first, on a path of its own: the same descent,
// shifted to one side and arriving a little behind, so there is a second small rocket and a thin trail
// to find in the thesis stop. Pure numbers; Craft and TrailRibbon use them.

export const COMPANION = {
  lead: 0.028, // how far ahead of the scroll it flies (the main craft's is 0.04)
  size: 0.55, // as large as the main craft, times this
  widthScale: 0.42, // its trail's width, times the main trail's
}

const START = [175, 70, -80] // far to the side and a little high, at the top of the descent
const END = [17, 0, 15] // beside the pad at the bottom

// How far the companion's path sits from the main path, at position t (0 to 1) along it.
export function companionOffset(t) {
  const u = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0))
  const near = (1 - u) * (1 - u) // 1 at the start, falling to 0
  return [0, 1, 2].map((k) => START[k] * near + END[k] * (1 - near))
}
