// Maps a shop slug onto an awning, so a shop keeps the same canopy everywhere it
// appears without the platform storing a colour for it.
//
// The colours are a fixed set rather than a hue computed from the hash. Market
// canvas is dyed in a short range — brick, ochre, olive, indigo — and walking a
// hash around the full colour wheel produced neon stripes that read as a
// spectrum rather than as a row of stalls.
const CANVAS = [
  '#a6462f', // brick
  '#c2872c', // ochre
  '#6b7639', // olive
  '#2e6e6b', // teal
  '#3a5480', // indigo
  '#9d5162', // rose
  '#7b5230', // tan
]

// The unbleached stripe between the dyed ones.
export const AWNING_CANVAS = '#efeade'

// FNV-1a: small, stable across runs and platforms, and well spread for short
// strings, which matters because two shops sitting next to each other in a grid
// must not land on the same canvas.
export const awningOf = (seed = '') => {
  let hash = 0x811c9dc5

  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }

  return CANVAS[Math.abs(hash) % CANVAS.length]
}
