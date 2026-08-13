import { Link } from 'react-router-dom'
import { ShopLogo } from '../ui'

/**
 * One shop in the grid.
 *
 * Modelled on how a marketplace lists its stores rather than its products:
 * logo, name, one line of context. There is nothing to compare on price yet, so
 * the card stays short and the grid stays scannable.
 */
const ShopCard = ({ shop, cityLabel, categoryLabel }) => (
  <Link
    to={`/s/${shop.slug}`}
    className="card flex flex-col items-center gap-3 p-4 text-center transition-shadow hover:shadow-md"
  >
    <ShopLogo shop={shop} size="md" />

    <span className="line-clamp-2 text-sm font-medium text-plaza-ink">{shop.name}</span>

    <span className="mt-auto text-xs text-plaza-muted">
      {[categoryLabel, cityLabel].filter(Boolean).join(' · ')}
    </span>
  </Link>
)

export default ShopCard
