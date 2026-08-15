import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MapPinIcon, PhotoIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { Avatar, Button, Confirm, ShopLogo } from '../../ui'
import Questions from '../../shared/Questions'
import { useAuth } from '../../../context/auth'
import { useCart } from '../../../context/cart'
import { useMeta } from '../../../context/meta'
import { notify } from '../../../utils/notify'
import orders from '../../../services/orders.services'
import { formatMoney } from '../../../utils/money'
import products from '../../../services/products.services'
import { useResource } from '../../../hooks/useResource'
import { withDeliveryLabels } from '../../../utils/vocabulary'

// The database value, mapped to the translation key that says it in the
// shopper's words. "like_new" is what the column holds; nobody reads that.
const CONDITION_KEY = {
  new: 'New',
  like_new: 'LikeNew',
  good: 'Good',
  acceptable: 'Acceptable',
  for_parts: 'ForParts',
}

/**
 * The photographs, one large and the rest as a strip.
 *
 * Clicking a thumbnail swaps the large one rather than opening a lightbox: on a
 * marketplace the photographs are evidence, and the fastest way to compare two
 * of them is to put them in the same frame one after the other.
 */
const Gallery = ({ images, title }) => {
  const { t } = useTranslation()
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
                aria-label={t('Product.Gallery.PhotoOf', { n: index + 1, total: images.length })}
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
  const { t } = useTranslation()

  if (product.shop) {
    return (
      <Link
        to={`/s/${product.shop.slug}`}
        className="flex items-center gap-3 rounded-pz border border-line p-3 transition-colors hover:border-line-strong"
      >
        <ShopLogo shop={product.shop} size="sm" />
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink">{product.shop.name}</span>
          <span className="block text-xs text-muted">{t('Product.Seller.VisitShop')}</span>
        </span>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-pz border border-line p-3">
      <Avatar account={product.seller} size="sm" />
      <span className="min-w-0">
        <span className="block truncate font-medium text-ink">{product.seller?.username}</span>
        <span className="block text-xs text-muted">{t('Product.Seller.SoldDirectly')}</span>
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
  const { t } = useTranslation()
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
          {open ? t('Product.Description.ReadLess') : t('Product.Description.ReadMore')}
        </button>
      )}
    </>
  )
}

/**
 * The two ways to buy, which are the same order arrived at differently.
 *
 * Buying now does not touch the basket. Someone who wanted one thing and got a
 * basket badge for their trouble has been given homework, and a handmade item
 * is usually bought one at a time.
 */
const Buy = ({ product }) => {
  const { t } = useTranslation()
  const { account, ready } = useAuth()
  const { add } = useCart()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [asking, setAsking] = useState(false)

  // Both sides can be undefined, and in JavaScript that compares equal. Without
  // the guard a signed-out visitor was told this was their own listing, which
  // is checked before the sign-in branch and so won the screen.
  const mine = Boolean(account?.id) && account.id === product.seller?.id
  const paused = product.status === 'paused'
  const gone = product.stock < 1

  if (!ready) return <div className="h-11" aria-hidden />

  if (mine) {
    return (
      <p className="rounded-pz border border-line bg-sunk px-4 py-3 text-sm text-muted">
        {t('Product.Buy.YourListing')}
      </p>
    )
  }

  // Before the stock check and before the sign-in prompt: a paused listing is
  // not a thing to sign in for, and the reason it cannot be bought is this one
  // and not whatever is on the shelf.
  if (paused) {
    return (
      <p className="rounded-pz border border-line border-l-[3px] border-l-info bg-sunk px-4 py-3 text-sm text-ink">
        <span className="font-medium">{t('Product.Buy.PausedTitle')}</span>{' '}
        <span className="text-muted">{t('Product.Buy.PausedBody')}</span>
      </p>
    )
  }

  if (gone) {
    return (
      <p className="rounded-pz border border-line bg-sunk px-4 py-3 text-sm text-muted">
        {t('Product.Buy.NoneLeft')}
      </p>
    )
  }

  // Signing in is the only thing in the way, so it is the only thing offered.
  if (!account) {
    return (
      <Button.Action
        as={Link}
        to="/access"
        state={{ from: `/p/${product.id}` }}
        size="lg"
        full
      >
        {t('Product.Buy.SignInToBuy')}
      </Button.Action>
    )
  }

  const buyNow = async () => {
    setAsking(false)
    setBusy(true)
    try {
      const order = await orders.place([{ productId: product.id, quantity: 1 }])
      notify(t('Product.Buy.Placed'), 'success')
      navigate(`/purchases#order-${order.id}`)
    } catch {
      // Reported by the interceptor, which names what ran out.
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button.Action size="lg" full loading={busy} onClick={() => setAsking(true)}>
        {t('Product.Buy.Now')}
      </Button.Action>

      {/* Asked before the order, not explained after it. What changes at the
          moment the seller accepts is the one thing a buyer cannot discover on
          their own, and by then it is too late to matter. */}
      <Confirm
        open={asking}
        title={t('Product.Buy.ConfirmTitle')}
        body={t('Product.Buy.ConfirmBody')}
        confirmLabel={t('Product.Buy.ConfirmLabel')}
        confirmColor="primary"
        loading={busy}
        onConfirm={buyNow}
        onCancel={() => setAsking(false)}
      />

      <Button.Action
        variant="soft" size="lg" full disabled={busy}
        // The context reports the outcome, success or refusal. Saying so here
        // too would announce a success the request had not had yet.
        onClick={() => add(product.id)}
      >
        {t('Product.Buy.AddToCart')}
      </Button.Action>
    </div>
  )
}

const Product = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { cities, delivery: rawDelivery } = useMeta()

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
          <h1 className="font-display text-xl font-semibold text-ink">{t('Product.NotFound.Title')}</h1>
          <p className="text-sm leading-relaxed text-muted">
            {t('Product.NotFound.Body')}
          </p>
          <Button.Action as={Link} to="/" variant="outline" color="neutral" size="sm">
            {t('Common.BackToPlaza')}
          </Button.Action>
        </div>
      </div>
    )
  }

  const city = cities.find(c => c.value === product.cityId)
  const ways = withDeliveryLabels(t, rawDelivery.filter(option => product.delivery?.includes(option.value)))

  return (
    <div className="shell py-8 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Gallery images={product.images ?? []} title={product.title} />

        <div className="flex flex-col gap-6">
          <div>
            {product.condition && (
              <span className="text-sm text-muted">{t(`Product.Condition.${CONDITION_KEY[product.condition]}`)}</span>
            )}

            <h1 className="mt-1 font-display text-2xl leading-tight font-bold tracking-tight text-ink sm:text-3xl">
              {product.title}
            </h1>

            <p className="tabular mt-4 font-display text-4xl leading-none font-semibold text-ink">
              {formatMoney(product.price, product.currency)}
            </p>

            <p className="mt-2 text-sm text-muted">
              {product.stock > 0
                ? t('Product.Stock.Available', { count: product.stock })
                : t('Product.Stock.NoneLeft')}
            </p>
          </div>

          <Buy product={product} />

        <Seller product={product} />

          {ways.length > 0 && (
            <section>
              <h2 className="font-display text-base font-semibold text-ink">{t('Product.DeliveryOptionsTitle')}</h2>
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
          <h2 className="font-display text-lg font-semibold text-ink">{t('Product.DescriptionTitle')}</h2>
          <div className="mt-4">
            <Description text={product.description} />
          </div>
        </section>
      )}

      {/* After the description, because a question is what you ask once the
          description has not answered it. */}
      <Questions product={product} />
    </div>
  )
}

export default Product
