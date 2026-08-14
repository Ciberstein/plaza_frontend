import clsx from 'clsx'
import { stallOf } from '../../utils/avatar'

// `fill` is the grid card, where the mark is the whole top of the tile. The
// fixed squares are for rows and headers, where it sits beside text.
const SIZES = {
  sm: 'size-11 rounded-pz text-lg',
  md: 'size-16 rounded-pz text-2xl',
  lg: 'size-24 rounded-pz text-4xl',
  fill: 'w-full aspect-4/3 text-5xl',
}

/**
 * A shop's logo, or the stall painted for it in `utils/avatar`.
 *
 * An uploaded logo is set on the shop's own paint rather than on the page:
 * logos arrive as transparent PNGs at every imaginable aspect ratio, and
 * contain-fitting one onto white leaves a shape floating in a void. On the
 * paint it reads as a sign on a stall, which is what it is.
 */
const ShopLogo = ({ shop, size = 'md', className }) => {
  const stall = stallOf(shop.slug ?? '', shop.name ?? '')
  const box = SIZES[size] ?? SIZES.md

  return (
    <span
      className={clsx(
        'relative block shrink-0 overflow-hidden',
        box,
        className,
      )}
      style={{ backgroundColor: stall.front }}
    >
      {shop.logo ? (
        <img
          src={shop.logo}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-contain p-[12%]"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center font-display font-bold leading-none"
          style={{ color: stall.ink }}
        >
          {stall.initial}
        </span>
      )}
    </span>
  )
}

export default ShopLogo
