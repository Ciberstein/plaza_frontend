import clsx from 'clsx'
import { formatMoney } from '../../utils/money'

const SIZES = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-3xl',
}

/**
 * A price, and the reason it is lower than it was.
 *
 * The discount is stated as the percentage off rather than the amount saved:
 * on a marketplace the same badge sits over items costing a few thousand pesos
 * and a few million, and a percentage is the only form that stays comparable
 * across both.
 */
const Price = ({ amount, was = null, currency = 'COP', size = 'md', className }) => {
  const discount =
    was && was > amount ? Math.round(((was - amount) / was) * 100) : null

  return (
    <div className={clsx('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      {was && (
        <span className="num text-xs text-plaza-mute line-through">
          {formatMoney(was, currency)}
        </span>
      )}

      <span className={clsx('num font-semibold text-plaza-ink', SIZES[size] ?? SIZES.md)}>
        {formatMoney(amount, currency)}
      </span>

      {discount !== null && (
        <span className="num text-sm font-medium text-plaza-clay">{discount}% off</span>
      )}
    </div>
  )
}

export default Price
