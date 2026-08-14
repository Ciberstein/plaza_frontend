import { useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { XMarkIcon } from '@heroicons/react/20/solid'
import ProductCard from '../../shared/ProductCard'
import { Button } from '../../ui'
import { useMeta } from '../../../context/meta'
import products from '../../../services/products.services'
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
        <div className="aspect-square animate-pulse bg-sunk" />
        <div className="flex flex-col gap-2 p-3">
          <div className="h-4 w-24 animate-pulse rounded-full bg-sunk" />
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-sunk" />
        </div>
      </div>
    ))}
  </div>
)

/**
 * The square itself: what is for sale.
 *
 * It listed shops until there was anything else to list. A directory is what a
 * marketplace shows when it has no merchandise, and showing one to a shopper
 * who arrived to buy something is asking them to do the work of finding the
 * goods themselves. The shops moved to /shops, where you go on purpose.
 */
const Home = () => {
  const { category } = useParams()
  const [params] = useSearchParams()
  const q = params.get('q')?.trim() || undefined
  const { categories } = useMeta()

  // The key carries both, so switching category while a search is open refetches
  // rather than showing the last answer under the new heading.
  const load = useCallback(() => products.browse({ q, category }), [q, category])
  const { data, loading } = useResource(load, `${category ?? ''}|${q ?? ''}`)
  const list = data ?? []

  const filtered = Boolean(category || q)
  const categoryLabel = categories.find(c => c.slug === category)?.label

  const heading = q
    ? `Results for “${q}”`
    : categoryLabel ?? category ?? 'Everything for sale'

  return (
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
            {q ? 'Nothing under that name yet' : 'This aisle is still empty'}
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            {q
              ? `Nothing matches “${q}”. A shorter word usually finds more.`
              : category
                ? 'Nobody has listed anything here yet. The first one gets the whole aisle.'
                : 'Nothing is for sale yet. Anyone with a confirmed email can list something.'}
          </p>
          <Button.Action as={Link} to="/sell" size="sm" className="mt-1">Sell on Plaza</Button.Action>
        </div>
      ) : (
        <div className={GRID}>
          {list.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Home
