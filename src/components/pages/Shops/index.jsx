import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { XMarkIcon } from '@heroicons/react/20/solid'
import ShopCard from '../../shared/ShopCard'
import { Button } from '../../ui'
import { useMeta } from '../../../context/meta'
import shops from '../../../services/shops.services'
import { useResource } from '../../../hooks/useResource'

const GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'

/**
 * The directory of shops.
 *
 * This used to be the home page, back when shops were all Plaza had. The front
 * page is merchandise now and this is a directory you go to on purpose, which
 * is the right weight for it: a shop is a brand a few sellers trade under, not
 * the thing a shopper came for.
 */
const Skeleton = () => (
  <div className={GRID} aria-hidden>
    {Array.from({ length: 10 }, (_, i) => (
      <div key={i} className="overflow-hidden rounded-pz border border-line bg-surface">
        <div className="aspect-4/3 animate-pulse bg-sunk" />
        <div className="flex flex-col gap-2 border-t border-line p-3">
          <div className="h-3.5 w-4/5 animate-pulse rounded-full bg-sunk" />
          <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-sunk" />
        </div>
      </div>
    ))}
  </div>
)

const Shops = () => {
  const [params] = useSearchParams()
  const q = params.get('q')?.trim() || undefined
  const { cities } = useMeta()

  const load = useCallback(() => shops.browse({ q }), [q])
  const { data, loading } = useResource(load, q ?? '')
  const list = data ?? []

  const labelFor = (source, value) => source.find(item => item.value === value)?.label

  return (
    <div className="shell py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <h1 className="rule-accent font-display text-2xl leading-tight font-bold tracking-tight text-ink sm:text-3xl">
          {q ? `Shops matching “${q}”` : 'Shops on Plaza'}
        </h1>

        {q && (
          <Link
            to="/shops"
            className="flex items-center gap-1.5 rounded-pz-sm border border-line-strong px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:border-ink hover:text-ink"
          >
            <XMarkIcon className="size-4" />
            Clear search
          </Link>
        )}
      </div>

      {loading ? (
        <Skeleton />
      ) : list.length === 0 ? (
        <div className="panel flex flex-col items-center gap-4 px-6 py-16 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">
            {q ? 'No shop under that name' : 'No shops yet'}
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            {q
              ? `Nothing matches “${q}”. A shorter word usually finds more.`
              : 'A shop is optional on Plaza. Most people sell under their own name.'}
          </p>
          <Button.Action as={Link} to="/sell" size="sm" className="mt-1">Sell on Plaza</Button.Action>
        </div>
      ) : (
        <div className={GRID}>
          {list.map((shop, i) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              index={i}
              cityLabel={labelFor(cities, shop.cityId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Shops
