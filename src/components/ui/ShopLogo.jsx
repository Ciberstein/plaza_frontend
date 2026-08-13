import clsx from 'clsx'
import { avatarOf } from '../../utils/avatar'

const SIZES = {
  sm: 'size-10 text-base',
  md: 'size-16 text-2xl',
  lg: 'size-24 text-4xl',
}

/**
 * A shop's logo, or a stand-in built from its name.
 *
 * Most shops will not have uploaded anything on the day they open, and an empty
 * square in a grid reads as a broken image. A letter tile reads as a shop that
 * has not finished setting up, which is what it is.
 */
const ShopLogo = ({ shop, size = 'md', className }) => {
  const { bg, fg, initial } = avatarOf(shop.slug, shop.name)

  return shop.logo ? (
    <img
      src={shop.logo}
      alt=""
      loading="lazy"
      className={clsx('shrink-0 rounded-plaza object-contain', SIZES[size] ?? SIZES.md, className)}
    />
  ) : (
    <span
      aria-hidden
      style={{ background: bg, color: fg }}
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-plaza font-semibold',
        SIZES[size] ?? SIZES.md,
        className,
      )}
    >
      {initial}
    </span>
  )
}

export default ShopLogo
