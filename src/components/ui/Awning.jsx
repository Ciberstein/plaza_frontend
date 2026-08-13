import clsx from 'clsx'
import { AWNING_CANVAS, awningOf } from '../../utils/awning'

/**
 * The striped canopy over a stall.
 *
 * Every shop in Plaza gets a canvas colour derived from its slug, so a shop
 * always wears the same stripe on its card, its storefront header and its seller
 * badge — without a seller having to pick a colour, and without the platform
 * storing one. It is the only place the interface is allowed to be decorative,
 * and it earns that by carrying identity: one square, many stalls.
 */
const Awning = ({ seed = '', className, rounded = true }) => (
  <div
    aria-hidden
    style={{ '--awning': awningOf(seed), '--awning-canvas': AWNING_CANVAS }}
    className={clsx('awning h-1 w-full', rounded && 'rounded-t-plaza', className)}
  />
)

export default Awning
