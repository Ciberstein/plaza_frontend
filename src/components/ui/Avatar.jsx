import clsx from 'clsx'
import { avatarOf } from '../../utils/avatar'

const SIZES = {
  sm: 'size-9 text-sm',
  md: 'size-14 text-xl',
  lg: 'size-20 text-3xl',
}

/**
 * A person's photo, or a letter tile built from their name.
 *
 * Same treatment as a shop's logo, so a listing sold by a person and one sold
 * by a shop sit next to each other without one looking unfinished.
 */
const Avatar = ({ account, size = 'md', className }) => {
  const { bg, fg, initial } = avatarOf(String(account?.id ?? ''), account?.username ?? '')

  return account?.avatar ? (
    <img
      src={account.avatar}
      alt=""
      className={clsx('shrink-0 rounded-full object-cover', SIZES[size] ?? SIZES.md, className)}
    />
  ) : (
    <span
      aria-hidden
      style={{ background: bg, color: fg }}
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full font-semibold',
        SIZES[size] ?? SIZES.md,
        className,
      )}
    >
      {initial}
    </span>
  )
}

export default Avatar
