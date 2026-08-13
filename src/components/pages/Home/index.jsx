import { useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import ShopCard from '../../shared/ShopCard'
import { Button } from '../../ui'
import { useMeta } from '../../../context/meta'
import shops from '../../../services/shops.services'
import { useResource } from '../../../hooks/useResource'

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
    <div className="flex flex-col gap-5">
      {/* A slim strip, not a headline. The home page of a marketplace is a
          route to the goods; anything that fills the first screen with a slogan
          pushes the goods below the fold. */}
      {!filtered && (
        <section className="card flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <p className="text-sm text-plaza-ink">
            <span className="font-medium">Sell on Plaza.</span>{' '}
            <span className="text-plaza-muted">
              Open a shop in a few minutes and start selling to buyers across Colombia.
            </span>
          </p>
          <Button as={Link} to="/sell" size="sm">Open your shop</Button>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h1 className="text-lg font-medium text-plaza-ink">{heading}</h1>
          {filtered && (
            <Link to="/" className="text-sm text-plaza-action hover:underline">
              Clear filters
            </Link>
          )}
        </div>

        {loading ? (
          // Placeholders the shape of the cards, so the grid does not jump when
          // the answer arrives.
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="card h-40 animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BuildingStorefrontIcon className="size-10 text-plaza-faint" />
            <p className="text-sm text-plaza-muted">
              {q
                ? `No shop matches “${q}”. Try a shorter word.`
                : category
                  ? 'No shop has opened in this category yet.'
                  : 'No shop has opened yet.'}
            </p>
            <Button as={Link} to="/sell" size="sm">Open the first one</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {list.map(shop => (
              <ShopCard
                key={shop.id}
                shop={shop}
                cityLabel={labelFor(cities, shop.cityId)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Home
