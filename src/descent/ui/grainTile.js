// Pixel data for the overlay grain: sparse pale and dark specks at low alpha on a clear ground.
const CREAM = [242, 230, 206]
const INK = [11, 18, 32]

export function grainPixels(size = 160, rand = Math.random) {
  const px = new Uint8ClampedArray(size * size * 4)
  for (let i = 0; i < px.length; i += 4) {
    const r = rand()
    if (r < 0.09) {
      px[i] = CREAM[0]
      px[i + 1] = CREAM[1]
      px[i + 2] = CREAM[2]
      px[i + 3] = 12 + Math.floor(rand() * 17)
    } else if (r < 0.2) {
      px[i] = INK[0]
      px[i + 1] = INK[1]
      px[i + 2] = INK[2]
      px[i + 3] = 14 + Math.floor(rand() * 19)
    }
  }
  return px
}
