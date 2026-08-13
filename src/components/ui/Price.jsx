import clsx from 'clsx'
import { formatMoney } from '../../utils/money'

const SIZES = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
}

/**
 * A price, what it used to be, and why it is lower.
 *
 * Set in a light weight rather than bold. A price is already the largest thing
 * on a card, and making it heavy as well turns a grid of products into a wall
 * of shouting where nothing stands out.
 *
 * The discount is a percentage, not an amount: the same badge sits over items
 * costing three thousand pesos and three million, and only a percentage stays
 * comparable across both.
 *
 * Both savings marks are orange rather than the customary green, because green
 * is the brand here and a badge painted in the brand colour reads as chrome.
 */
const Price = ({ amount, was = null, currency = 'COP', size = 'md', freeShipping = false, className }) => {
  const discount = was && was > amount ? Math.round(((was - amount) / was) * 100) : null

  return (
    <div className={clsx('tabular flex flex-col gap-0.5', className)}>
      {was && (
        <span className="text-xs text-plaza-faint line-through">
          {formatMoney(was, currency)}
        </span>
      )}

      <span className="flex flex-wrap items-baseline gap-2">
        <span className={clsx('font-light text-plaza-ink', SIZES[size] ?? SIZES.md)}>
          {formatMoney(amount, currency)}
        </span>
        {discount !== null && (
          <span className="text-sm font-medium text-plaza-deal">{discount}% OFF</span>
        )}
      </span>

      {freeShipping && (
        <span className="text-sm font-semibold text-plaza-deal">Free shipping</span>
      )}
    </div>
  )
}

export default Price
