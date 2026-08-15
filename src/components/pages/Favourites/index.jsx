import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import ListingCard from '../../shared/ListingCard'
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
  const { t } = useTranslation()
  // Only for the loading gate. The list itself is not filtered against this
  // set: it used to be, so that un-hearting a card removed it at once, and the
  // price was that a failed ids request — which is swallowed on purpose,
  // because a badge is not worth a toast — emptied the whole page. Two fetches
  // that have to agree is one more thing that can disagree.
  const { ready } = useFavourites()

  const load = useCallback(() => favourites.list(), [])
  const { data, loading } = useResource(load, 'favourites')

  const rows = (data ?? []).filter(row => row.product)

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
        {t('Favourites.Title')}
      </h1>

      {rows.length === 0 ? (
        <div className="panel mt-8 flex flex-col items-center gap-4 px-6 py-16 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">{t('Favourites.Empty.Title')}</h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            {t('Favourites.Empty.Body')}
          </p>
          <Button.Action as={Link} to="/" size="sm" className="mt-1">{t('Common.BrowsePlaza')}</Button.Action>
        </div>
      ) : (
        <div className={`${GRID} mt-8`}>
          {rows.map((row, i) => (
            <ListingCard
              key={row.id}
              index={i}
              // The favourites endpoint answers with the listing and its cover
              // rather than every photograph, so the card falls back to the one
              // it has. Flicking through them is a browsing thing, and this is
              // a page of decisions already made.
              product={row.product}
              // Only active and paused reach this list; the server leaves out
              // anything the public has no business seeing. Paused is kept and
              // marked, because a bookmark that vanishes reads as the site
              // losing it rather than the seller withdrawing it.
              state={row.state}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Favourites
