import clsx from 'clsx'
import { plateOf } from '../../utils/avatar'

const SIZES = {
  sm: 'size-8 text-sm',
  md: 'size-14 text-xl',
  lg: 'size-20 text-3xl',
}

/**
 * A person's photo, or a plate painted from their name.
 *
 * Round where a shop's mark is square: on a marketplace where a listing can be
 * sold by either, the shape alone says which one you are looking at before you
 * read anything.
 */
const Avatar = ({ account, size = 'md', className }) => {
  const plate = plateOf(String(account?.id ?? ''), account?.username ?? '')

  return account?.avatar ? (
    <img
      src={account.avatar}
      alt=""
      className={clsx(
        'shrink-0 rounded-full object-cover',
        SIZES[size] ?? SIZES.md,
        className,
      )}
    />
  ) : (
    <span
      aria-hidden
      style={{ background: plate.bg, color: plate.fg }}
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full font-display font-bold leading-none',
        SIZES[size] ?? SIZES.md,
        className,
      )}
    >
      {plate.initial}
    </span>
  )
}

export default Avatar
