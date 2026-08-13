import { Link } from 'react-router-dom'
import { MapPinIcon } from '@heroicons/react/20/solid'
import { Awning } from '../ui'

/**
 * One stall in the grid.
 *
 * The awning is the only part of the card that differs between shops, and the
 * shop does not choose it — it comes from the slug. Everything below stays
 * identical from card to card so the grid can be scanned.
 */
const ShopCard = ({ shop, cityLabel }) => (
  <article className="flex flex-col overflow-hidden rounded-plaza border border-plaza-line bg-plaza-paper transition-shadow hover:shadow-md hover:shadow-plaza-ink/10">
    <Awning seed={shop.slug} />

    <Link to={`/s/${shop.slug}`} className="flex grow flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold tracking-tight text-plaza-ink">{shop.name}</h3>
        {shop.category && (
          <span className="shrink-0 rounded-plaza border border-plaza-line px-2 py-0.5 text-xs text-plaza-mute">
            {shop.category}
          </span>
        )}
      </div>

      <p className="line-clamp-2 grow text-sm text-plaza-mute">
        {shop.description || 'This shop has not written a description yet.'}
      </p>

      {cityLabel && (
        <span className="flex items-center gap-1 text-xs text-plaza-mute">
          <MapPinIcon className="size-3.5" />
          {cityLabel}
        </span>
      )}
    </Link>
  </article>
)

export default ShopCard
