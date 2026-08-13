import { useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import ShopCard from '../../shared/ShopCard'
import { Awning, Button } from '../../ui'
import { useMeta } from '../../../context/meta'
import shops from '../../../services/shops.services'
import { useResource } from '../../../hooks/useResource'

const Home = () => {
  const { category } = useParams()
  const [params] = useSearchParams()
  const q = params.get('q')?.trim() || undefined
  const { categories, cities } = useMeta()

  const load = useCallback(() => shops.browse({ category, q }), [category, q])
  const { data, loading } = useResource(load, `${category ?? ''}|${q ?? ''}`)
  const list = data ?? []

  const cityLabel = value => cities.find(c => c.value === value)?.label
  const heading = q
    ? `Results for “${q}”`
    : category
      ? categories.find(c => c.value === category)?.label ?? category
      : 'New in the square'

  return (
    <div className="flex flex-col gap-8">
      <section className="overflow-hidden rounded-plaza border border-plaza-line bg-plaza-paper">
        {/* A row of awnings, one per shop actually open, so the band is a
            picture of the square rather than decoration. */}
        <div className="flex">
          {(list.length ? list.slice(0, 6) : [{ slug: 'plaza' }]).map(shop => (
            <Awning key={shop.slug} seed={shop.slug} rounded={false} className="h-2" />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Every stall here belongs to someone.
            </h1>
            <p className="mt-1.5 max-w-lg text-sm text-plaza-mute">
              Buy from small shops across Colombia, or open your own in a few minutes
              and sell to the same square.
            </p>
          </div>

          <Button variant="accent" size="lg" as={Link} to="/sell">
            Open your shop
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">{heading}</h2>

        {loading ? (
          <p className="text-sm text-plaza-mute">Loading the square…</p>
        ) : list.length === 0 ? (
          // An empty square is an invitation, not an apology.
          <div className="rounded-plaza border border-dashed border-plaza-line p-10 text-center">
            <p className="text-sm text-plaza-mute">
              {q
                ? `No shop matches "${q}". Try a shorter word.`
                : category
                  ? 'No shop has opened in this category yet.'
                  : 'No shop has opened yet.'}
            </p>
            <Button variant="primary" className="mt-4" as={Link} to="/sell">
              Be the first
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map(shop => (
              <ShopCard key={shop.id} shop={shop} cityLabel={cityLabel(shop.city)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Home
