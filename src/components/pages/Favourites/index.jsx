import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../../shared/ProductCard'
import { Button } from '../../ui'
import { useFavourites } from '../../../context/favourites'
import favourites from '../../../services/favourites.services'
import { useResource } from '../../../hooks/useResource'

const GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'

/**
 * The things this person kept.
 *
 * The list is fetched once and then filtered against the live set of ids, so
 * un-hearting a card here makes it leave immediately instead of sitting there
 * greyed out until a refetch. The row is gone from the server either way; this
 * only decides whether the page waits to be told.
 */
const Favourites = () => {
  const { ids, ready } = useFavourites()

  const load = useCallback(() => favourites.list(), [])
  const { data, loading } = useResource(load, 'favourites')

  const rows = (data ?? []).filter(row => row.product && ids.has(row.productId))

  if (loading || !ready) {
    return (
      <div className="shell py-8 sm:py-10" aria-hidden>
        <div className="h-9 w-48 animate-pulse rounded-full bg-sunk" />
        <div className={`${GRID} mt-8`}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-pz border border-line bg-surface">
              <div className="aspect-square animate-pulse bg-sunk" />
              <div className="flex flex-col gap-2 p-3">
                <div className="h-4 w-24 animate-pulse rounded-full bg-sunk" />
                <div className="h-3 w-4/5 animate-pulse rounded-full bg-sunk" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="shell py-8 sm:py-10">
      <h1 className="rule-accent font-display text-3xl font-bold tracking-tight text-ink">
        Saved
      </h1>

      {rows.length === 0 ? (
        <div className="panel mt-8 flex flex-col items-center gap-4 px-6 py-16 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">Nothing saved yet</h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            The heart on any listing keeps it here. Nobody is told you saved it.
          </p>
          <Button.Action as={Link} to="/" size="sm" className="mt-1">Browse Plaza</Button.Action>
        </div>
      ) : (
        <div className={`${GRID} mt-8`}>
          {rows.map((row, i) => (
            <ProductCard
              key={row.id}
              index={i}
              // The favourites endpoint answers with the listing and its cover
              // rather than every photograph, so the card falls back to the one
              // it has. Flicking through them is a browsing thing, and this is
              // a page of decisions already made.
              product={row.product}
              // Paused, archived, or behind a shop that closed. Kept on the
              // page and marked, because a bookmark that vanishes reads as the
              // site losing it rather than the seller withdrawing it.
              unavailable={!row.available}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Favourites
