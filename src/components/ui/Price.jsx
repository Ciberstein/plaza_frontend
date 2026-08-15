import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
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
 * The discount is a marigold tag rather than marigold type. Marigold is the
 * one colour on Plaza that carries attention, and at any size small enough to
 * sit beside a price it does not hold contrast as text — so it is always the
 * background, with ink on top.
 */
const Price = ({ amount, was = null, currency = 'COP', size = 'md', freeShipping = false, className }) => {
  const { t } = useTranslation()
  const discount = was && was > amount ? Math.round(((was - amount) / was) * 100) : null

  return (
    <div className={clsx('tabular flex flex-col gap-0.5', className)}>
      {was && (
        <span className="text-xs text-faint line-through">
          {formatMoney(was, currency)}
        </span>
      )}

      <span className="flex flex-wrap items-baseline gap-2">
        <span className={clsx('font-display font-medium tracking-tight text-ink', SIZES[size] ?? SIZES.md)}>
          {formatMoney(amount, currency)}
        </span>
        {discount !== null && (
          <span className="rounded-pz-sm bg-accent px-1.5 py-0.5 text-xs font-bold text-on-accent">
            -{discount}%
          </span>
        )}
      </span>

      {freeShipping && (
        <span className="text-sm font-semibold text-good">{t('Shared.Price.FreeShipping')}</span>
      )}
    </div>
  )
}

export default Price
