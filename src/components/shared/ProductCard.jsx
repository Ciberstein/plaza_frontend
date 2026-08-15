import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronLeftIcon, ChevronRightIcon, HeartIcon } from '@heroicons/react/20/solid'
import { HeartIcon as HeartOutline, PhotoIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useAuth } from '../../context/auth'
import { useFavourites } from '../../context/favourites'
import { Score } from '../ui/Stars'
import { formatRate } from '../../utils/vocabulary'

// The database value, mapped to the translation key that says it in the
// shopper's words. "like_new" is what the column holds; nobody reads that.
const CONDITION_KEY = {
  new: 'New',
  like_new: 'LikeNew',
  good: 'Good',
  acceptable: 'Acceptable',
  for_parts: 'ForParts',
}

const DAY = 24 * 60 * 60 * 1000

// Read once, when the module loads, rather than on every render. Date.now() is
// impure and a card must not be, and nothing is lost: "new since you opened the
// page" and "new right now" differ only for a tab left open overnight.
const OPENED_AT = Date.now()

/**
 * One listing in a grid.
 *
 * The photographs can be flicked through without opening it. Arrows rather than
 * a timer: a card that changes on its own moves the thing you were looking at
 * out from under you, and on a page of forty-eight of them it is a fairground.
 *
 * The whole card is one link, so the arrows and the heart have to stop the
 * click from reaching it. They are buttons inside an anchor, which is invalid
 * markup, so the anchor is the outer element and they preventDefault instead.
 */
const ProductCard = ({ product, index = 0, state = 'active' }) => {
  const { t } = useTranslation()
  const { account } = useAuth()
  const { has, toggle } = useFavourites()
  const [shot, setShot] = useState(0)

  const images = product.images?.length
    ? product.images
    : product.cover
      ? [{ id: 'cover', url: product.cover }]
      : []

  const seller = product.shop?.name ?? product.seller?.username
  // A service has no condition — there is no second-hand hour — so the line
  // under the title carries only who is offering it.
  const condition = product.condition
    ? t(`Shared.ProductCard.Condition.${CONDITION_KEY[product.condition]}`)
    : null
  const kept = has(product.id)
  const mine = Boolean(account?.id) && account.id === product.seller?.id

  const fresh =
    product.createdAt && OPENED_AT - new Date(product.createdAt).getTime() < DAY

  // Inside an anchor, so every one of these has to say so.
  const step = (event, by) => {
    event.preventDefault()
    event.stopPropagation()
    setShot(current => (current + by + images.length) % images.length)
  }

  const keep = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!mine) toggle(product.id)
  }

  // Always a link. A paused listing keeps its own address on purpose — whoever
  // saved it or was sent the link should open it and be told the seller paused
  // it, rather than be handed a card that does nothing.
  const paused = state === 'paused'

  return (
    <Link
      to={`/p/${product.id}`}
      style={{ '--i': index }}
      className={clsx(
        'rise-in group relative flex flex-col overflow-hidden rounded-pz border border-line bg-surface',
        'transition-all duration-300 ease-pz hover:border-line-strong hover:shadow-sm',
        paused && 'opacity-70',
      )}
    >
      <span className="relative block">
        {images[shot] ? (
          <img
            src={images[shot].url}
            alt=""
            loading="lazy"
            className="aspect-square w-full bg-sunk object-cover"
          />
        ) : (
          // Nothing published should reach this, since a photo is required to
          // publish. It exists because a stored file can still go missing, and
          // a broken image icon is a worse answer than an empty frame.
          <span className="flex aspect-square w-full items-center justify-center bg-sunk text-faint">
            <PhotoIcon className="size-8" />
          </span>
        )}

        {paused && (
          <span className="absolute inset-x-0 bottom-0 z-10 bg-ink/85 py-1.5 text-center text-[11px] font-semibold tracking-wide text-ground uppercase">
            {t('Shared.ProductCard.Paused')}
          </span>
        )}

        {fresh && !paused && (
          <span className="absolute top-2 left-2 rounded-pz-sm bg-ink/85 px-2 py-1 text-[11px] font-semibold text-ground">
            {t('Shared.ProductCard.JustListed')}
          </span>
        )}

        {/* Present on every card, including your own.
            It used to be hidden on your own listings, on the reasoning that
            saving something you are selling is not a thing anyone means to do.
            That reasoning was fine and the result was not: on a grid where
            every other card carries a heart, the one that does not reads as a
            bug rather than as a rule. It is disabled instead, and says why. */}
        <button
          type="button"
          onClick={keep}
          disabled={mine}
          title={mine ? t('Shared.ProductCard.YourListing') : undefined}
          aria-label={
            mine
              ? t('Shared.ProductCard.YourListing')
              : kept ? t('Shared.ProductCard.RemoveFavourite') : t('Shared.ProductCard.SaveFavourite')
          }
          aria-pressed={mine ? undefined : kept}
          className={clsx(
            'absolute top-2 right-2 flex size-8 items-center justify-center rounded-full',
            'bg-surface/90 shadow-sm transition-colors',
            mine ? 'cursor-not-allowed opacity-45' : 'cursor-pointer hover:bg-surface',
          )}
        >
          {kept ? (
            <HeartIcon className="size-4.5 text-alert" />
          ) : (
            <HeartOutline className="size-4.5 text-muted" />
          )}
        </button>

        {images.length > 1 && !paused && (
          <>
            {/* Shown on hover on a pointer, always on a touch screen, where
                there is no hover to reveal them with. */}
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <button
                type="button"
                onClick={e => step(e, -1)}
                aria-label={t('Shared.ProductCard.PreviousPhoto')}
                className="pointer-events-auto flex size-7 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-ink shadow-sm transition-colors hover:bg-surface"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
            </span>

            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <button
                type="button"
                onClick={e => step(e, 1)}
                aria-label={t('Shared.ProductCard.NextPhoto')}
                className="pointer-events-auto flex size-7 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-ink shadow-sm transition-colors hover:bg-surface"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </span>

            <span className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
              {images.map((image, i) => (
                <span
                  key={image.id}
                  className={clsx(
                    'size-1.5 rounded-full transition-colors',
                    i === shot ? 'bg-ink' : 'bg-ink/25',
                  )}
                />
              ))}
            </span>
          </>
        )}
      </span>

      <span className="flex grow flex-col gap-1 p-3">
        <span className="tabular font-display text-lg leading-none font-semibold text-ink">
          {formatRate(t, product)}
        </span>

        <span className="line-clamp-2 text-sm leading-snug text-ink">{product.title}</span>

        {/* Only once somebody has rated it. Five empty stars on every new
            listing would read as a bad score rather than as no score, and a
            grid of them would say nothing while taking up a line each. */}
        {product.rating?.count > 0 && (
          <Score
            average={product.rating.average}
            count={product.rating.count}
            size="sm"
            showCount={false}
            className="pt-0.5"
          />
        )}

        <span className="mt-auto pt-1.5 text-xs text-faint">
          {[seller, condition].filter(Boolean).join(' · ')}
        </span>
      </span>
    </Link>
  )
}

export default ProductCard
