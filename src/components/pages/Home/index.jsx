import { useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { XMarkIcon } from '@heroicons/react/20/solid'
import ShopCard from '../../shared/ShopCard'
import { Button } from '../../ui'
import { useMeta } from '../../../context/meta'
import shops from '../../../services/shops.services'
import { useResource } from '../../../hooks/useResource'

const GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'

/**
 * Placeholders the shape of the cards, so the grid does not jump when the
 * answer arrives. The proportions are the card's, not a generic block: a
 * skeleton that settles into a different shape is worse than no skeleton.
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

const Home = () => {
  const { category } = useParams()
  const [params] = useSearchParams()
  const q = params.get('q')?.trim() || undefined
  const { categories, cities } = useMeta()

  const load = useCallback(() => shops.browse({ q }), [q])
  const { data, loading } = useResource(load, q ?? '')
  const list = data ?? []

  const labelFor = (source, value) => source.find(item => item.value === value)?.label
  const filtered = Boolean(category || q)

  // A category names a product aisle, and products do not exist yet, so the
  // strip narrows nothing until the catalogue lands.
  const heading = q
    ? `Results for “${q}”`
    : category
      ? categories.find(c => c.slug === category)?.label ?? category
      : 'Shops on Plaza'

  return (
    <>
      <div className="shell py-8 sm:py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h1 className="rule-accent font-display text-2xl leading-tight font-bold tracking-tight text-ink sm:text-3xl">
            {heading}
          </h1>

          {filtered && (
            <Link
              to="/"
              className="flex items-center gap-1.5 rounded-pz-sm border border-line-strong px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:border-ink hover:text-ink"
            >
              <XMarkIcon className="size-4" />
              Clear filters
            </Link>
          )}
        </div>

        {loading ? (
          <Skeleton />
        ) : list.length === 0 ? (
          <div className="panel flex flex-col items-center gap-4 px-6 py-16 text-center">
            <h2 className="font-display text-xl font-semibold text-ink">
              {q ? 'Nothing under that name yet' : 'This corner is still empty'}
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              {q
                ? `No shop matches “${q}”. A shorter word usually finds more.`
                : category
                  ? 'No shop has opened in this category yet. The first one gets the whole aisle.'
                  : 'No shop has opened yet. The first one gets the whole square.'}
            </p>
            <Button as={Link} to="/sell" size="sm" className="mt-1">Sell on Plaza</Button>
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

    </>
  )
}

export default Home
