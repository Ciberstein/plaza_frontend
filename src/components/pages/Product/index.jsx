import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPinIcon, PhotoIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { Avatar, Button, ShopLogo } from '../../ui'
import { useMeta } from '../../../context/meta'
import { formatMoney } from '../../../utils/money'
import products from '../../../services/products.services'
import { useResource } from '../../../hooks/useResource'

// The shopper's words. `like_new` is a database value.
const CONDITION = {
  new: 'New',
  like_new: 'Like new',
  good: 'Good condition',
  acceptable: 'Used, and it shows',
  for_parts: 'For parts',
}

/**
 * The photographs, one large and the rest as a strip.
 *
 * Clicking a thumbnail swaps the large one rather than opening a lightbox: on a
 * marketplace the photographs are evidence, and the fastest way to compare two
 * of them is to put them in the same frame one after the other.
 */
const Gallery = ({ images, title }) => {
  const [active, setActive] = useState(0)
  const current = images[active]

  if (!current) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-pz border border-line bg-sunk text-faint">
        <PhotoIcon className="size-10" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <img
        src={current.url}
        alt={title}
        className="aspect-square w-full rounded-pz border border-line bg-sunk object-cover"
      />

      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Photo ${index + 1} of ${images.length}`}
                aria-current={index === active}
                className={clsx(
                  'block w-full cursor-pointer overflow-hidden rounded-pz-sm border transition-colors',
                  index === active ? 'border-accent' : 'border-line hover:border-line-strong',
                )}
              >
                <img src={image.url} alt="" className="aspect-square w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Who is selling it: a shop, or a person. Never both. */
const Seller = ({ product }) => {
  if (product.shop) {
    return (
      <Link
        to={`/s/${product.shop.slug}`}
        className="flex items-center gap-3 rounded-pz border border-line p-3 transition-colors hover:border-line-strong"
      >
        <ShopLogo shop={product.shop} size="sm" />
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink">{product.shop.name}</span>
          <span className="block text-xs text-muted">Visit the shop</span>
        </span>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-pz border border-line p-3">
      <Avatar account={product.seller} size="sm" />
      <span className="min-w-0">
        <span className="block truncate font-medium text-ink">{product.seller?.username}</span>
        <span className="block text-xs text-muted">Sold by this person directly</span>
      </span>
    </div>
  )
}

/**
 * A description that folds itself when it is long.
 *
 * Whether to offer the button is measured, not counted: a wall of six hundred
 * characters and six hundred characters of short lines occupy very different
 * amounts of screen, and a character threshold gets one of the two wrong. The
 * clamp does the folding, and the only question left is whether it clamped
 * anything.
 */
const Description = ({ text }) => {
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  const [clipped, setClipped] = useState(false)

  useEffect(() => {
    const node = ref.current
    // Nothing to measure once it is open: unclamped, the text always fits
    // itself, and asking again would answer "no" and take the button away.
    if (!node || open) return

    const watch = new ResizeObserver(() =>
      setClipped(node.scrollHeight > node.clientHeight + 1),
    )

    watch.observe(node)
    return () => watch.disconnect()
  }, [open, text])

  return (
    <>
      <p
        ref={ref}
        className={clsx(
          'text-[15px] leading-relaxed whitespace-pre-line text-muted',
          !open && 'line-clamp-6',
        )}
      >
        {text}
      </p>

      {clipped && (
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="mt-3 cursor-pointer text-sm font-medium text-link hover:underline"
        >
          {open ? 'Read less' : 'Read more'}
        </button>
      )}
    </>
  )
}

const Product = () => {
  const { id } = useParams()
  const { cities, delivery: deliveryOptions } = useMeta()

  const load = useCallback(() => products.read(id), [id])
  const { data: product, error, loading } = useResource(load, id)

  if (loading) {
    return (
      <div className="shell grid gap-8 py-8 sm:py-10 lg:grid-cols-2" aria-hidden>
        <div className="aspect-square w-full animate-pulse rounded-pz bg-sunk" />
        <div className="flex flex-col gap-4 pt-2">
          <div className="h-8 w-40 animate-pulse rounded-full bg-sunk" />
          <div className="h-5 w-3/4 animate-pulse rounded-full bg-sunk" />
          <div className="h-24 w-full animate-pulse rounded-pz bg-sunk" />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="shell py-8 sm:py-10">
        <div className="panel mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
          <h1 className="font-display text-xl font-semibold text-ink">This listing is gone</h1>
          <p className="text-sm leading-relaxed text-muted">
            It may have sold, been taken down, or the link may be wrong.
          </p>
          <Button.Action as={Link} to="/" variant="outline" color="neutral" size="sm">
            Back to Plaza
          </Button.Action>
        </div>
      </div>
    )
  }

  const city = cities.find(c => c.value === product.cityId)
  const ways = deliveryOptions.filter(option => product.delivery?.includes(option.value))

  return (
    <div className="shell py-8 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Gallery images={product.images ?? []} title={product.title} />

        <div className="flex flex-col gap-6">
          <div>
            {product.condition && (
              <span className="text-sm text-muted">{CONDITION[product.condition]}</span>
            )}

            <h1 className="mt-1 font-display text-2xl leading-tight font-bold tracking-tight text-ink sm:text-3xl">
              {product.title}
            </h1>

            <p className="tabular mt-4 font-display text-4xl leading-none font-semibold text-ink">
              {formatMoney(product.price, product.currency)}
            </p>

            <p className="mt-2 text-sm text-muted">
              {product.stock > 0
                ? `${product.stock} available`
                : 'None left right now'}
            </p>
          </div>

          <Seller product={product} />

          {ways.length > 0 && (
            <section>
              <h2 className="font-display text-base font-semibold text-ink">How you can get it</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {ways.map(way => (
                  <li key={way.value} className="text-sm text-ink">
                    {way.label}
                    <span className="block text-xs text-muted">{way.subtitle}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {city && (
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <MapPinIcon className="size-4 shrink-0 text-faint" />
              {city.label}
              {city.subtitle && `, ${city.subtitle}`}
            </p>
          )}

        </div>
      </div>

      {product.description && (
        <section className="mt-10 border-t border-line pt-8">
          <h2 className="font-display text-lg font-semibold text-ink">Description</h2>
          <div className="mt-4">
            <Description text={product.description} />
          </div>
        </section>
      )}
    </div>
  )
}

export default Product
