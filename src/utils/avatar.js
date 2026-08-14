/**
 * Stand-in imagery for a shop that has not uploaded a logo, and for a person
 * who has not uploaded a photo.
 *
 * Almost no shop has a logo on the day it opens, so on a marketplace this
 * young the placeholder is not an edge case — it is what the grid is mostly
 * made of. A grey square with a letter in it reads as a broken image, and a
 * page of them reads as an empty product.
 *
 * A shop gets a stall: a striped canopy over a plain front, with its initial
 * painted on the front. That is what the shops in a plaza de mercado actually
 * look like, it gives every shop a mark that is its own and stable, and it is
 * built from two gradients rather than an image, so a grid of sixty costs
 * nothing to draw.
 *
 * A person gets a plain plate in the same paint. People are not stalls, and
 * telling a seller apart from a shop at a glance is worth the distinction.
 */

// Tile paints. Pale tints on a white page, each with its own ink measured
// against the tint it sits on rather than picked by eye. Pale on purpose:
// sixty of these appear in one grid, and a saturated set would out-shout the
// shop names underneath and the real logos beside them.
const PAINTS = [
  { front: '#e6ebf6', ink: '#2a4a86' }, // azul
  { front: '#e4eeec', ink: '#255f52' }, // salvia
  { front: '#e3edf0', ink: '#245a6b' }, // agua
  { front: '#eae9f3', ink: '#443f7a' }, // indigo
  { front: '#f2e9ec', ink: '#7d3f52' }, // rosa
  { front: '#eceef1', ink: '#465262' }, // pizarra
]

// FNV-1a: small, stable across runs and platforms, and well spread for short
// strings, so two shops sitting next to each other in a grid do not get handed
// the same paint.
const hash = (seed = '') => {
  let h = 0x811c9dc5

  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }

  return Math.abs(h)
}

// The first letter of the name, not of the slug: the slug is lowercase and may
// start with a word the shop does not lead with.
const initialOf = (name = '') => (name.trim()[0] ?? '?').toUpperCase()

/**
 * A shop's stall: one flat paint, with the shop's initial set on it in the
 * display face. The same values work on the 44px tile in the dashboard list and
 * on the 4:3 tile at the top of a card, because nothing here is measured in
 * pixels.
 */
export const stallOf = (seed = '', name = '') => {
  const paint = PAINTS[hash(seed) % PAINTS.length]

  return { ...paint, initial: initialOf(name) }
}

/** A person's plate: the same paints, drawn round instead of square. */
export const plateOf = (seed = '', name = '') => {
  const paint = PAINTS[hash(seed) % PAINTS.length]

  return {
    bg: paint.front,
    fg: paint.ink,
    initial: initialOf(name),
  }
}
