import { Link } from 'react-router-dom'
import { ShopLogo } from '../ui'

/**
 * One shop in the grid.
 *
 * Modelled on how a marketplace lists its stores rather than its products:
 * the mark takes the whole top of the tile and the text sits under it, left
 * aligned. Centring all three lines was what made the old grid interchangeable
 * — every card was the same symmetrical stack, so nothing about a shop reached
 * the eye before the name was read.
 *
 * `index` only drives the entry delay, so the grid fills in reading order when
 * the answer lands rather than appearing all at once.
 */
const ShopCard = ({ shop, cityLabel, categoryLabel, index = 0 }) => {
  const meta = [categoryLabel, cityLabel].filter(Boolean).join(' · ')

  return (
    <Link
      to={`/s/${shop.slug}`}
      style={{ '--i': index }}
      className="rise-in group flex flex-col overflow-hidden rounded-pz border border-line bg-surface transition-[transform,border-color] duration-200 ease-pz hover:-translate-y-0.5 hover:border-line-strong"
    >
      <ShopLogo shop={shop} size="fill" />

      <span className="flex grow flex-col gap-1 border-t border-line p-3">
        <span className="line-clamp-2 font-display text-[15px] leading-snug font-semibold text-ink">
          {shop.name}
        </span>
        {meta && <span className="mt-auto text-xs text-faint">{meta}</span>}
      </span>
    </Link>
  )
}

export default ShopCard
