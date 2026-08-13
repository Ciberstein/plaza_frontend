// A stand-in logo for a shop that has not uploaded one.
//
// The tints are deliberately pale: this sits in a grid next to real product
// photos and shop logos, and a saturated placeholder would pull more attention
// than the real thing it is standing in for.
const TINTS = [
  { bg: '#e6eefc', fg: '#1f53c4' },
  { bg: '#e8f5ec', fg: '#0a7c42' },
  { bg: '#fdeee6', fg: '#b8542a' },
  { bg: '#f0eafc', fg: '#5b3ba8' },
  { bg: '#fdecea', fg: '#b02a20' },
  { bg: '#e7f3f5', fg: '#0f6b7a' },
]

// FNV-1a: small, stable across runs and platforms, and well spread for short
// strings, so two shops next to each other in a grid do not land on the same
// tint.
const hash = (seed = '') => {
  let h = 0x811c9dc5

  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }

  return Math.abs(h)
}

export const avatarOf = (seed = '', name = '') => ({
  ...TINTS[hash(seed) % TINTS.length],
  // The first letter of the name, not of the slug: the slug is lowercase and
  // may start with a word the shop does not lead with.
  initial: (name.trim()[0] ?? '?').toUpperCase(),
})
