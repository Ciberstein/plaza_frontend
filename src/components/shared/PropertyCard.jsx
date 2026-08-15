import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronLeftIcon, ChevronRightIcon, HeartIcon } from '@heroicons/react/20/solid'
import { HeartIcon as HeartOutline, PhotoIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useAuth } from '../../context/auth'
import { useFavourites } from '../../context/favourites'
import { formatRate, propertySummary } from '../../utils/vocabulary'
import { formatMoney } from '../../utils/money'

/**
 * One property in a grid.
 *
 * A card of its own rather than a branch inside `ProductCard`, because almost
 * nothing the two show is the same. A shirt's card answers "what is it, what
 * condition, who is selling"; this one answers "how much, how big, how many
 * rooms, which neighbourhood", and somebody scanning forty of them is
 * comparing those four numbers down a column. Sharing a component would mean
 * two sets of conditionals inside every line of it to produce two layouts that
 * only look alike because they are both rectangles.
 *
 * What is shared is the behaviour: the photographs flick, the heart saves, and
 * the whole card is one link with the controls stopping the click.
 */
const PropertyCard = ({ product, index = 0, state = 'active' }) => {
  const { t } = useTranslation()
  const { account } = useAuth()
  const { has, toggle } = useFavourites()
  const [shot, setShot] = useState(0)

  const property = product.property
  const images = product.images?.length
    ? product.images
    : product.cover
      ? [{ id: 'cover', url: product.cover }]
      : []

  const kept = has(product.id)
  const mine = Boolean(account?.id) && account.id === product.seller?.id
  const paused = state === 'paused'

  // The barrio first, the city after: somebody looking for a flat in Laureles
  // knows perfectly well that Laureles is in Medellín, and reads the second
  // half only when the first is unfamiliar.
  const where = [property?.neighborhood, product.city?.name]
    .filter(Boolean)
    .join(', ')

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
            // Wider than tall, unlike a product. A room photographed square is
            // a room with its ceiling and its floor cropped off.
            className="aspect-4/3 w-full bg-sunk object-cover"
          />
        ) : (
          <span className="flex aspect-4/3 w-full items-center justify-center bg-sunk text-faint">
            <PhotoIcon className="size-8" />
          </span>
        )}

        {paused && (
          <span className="absolute inset-x-0 bottom-0 z-10 bg-ink/85 py-1.5 text-center text-[11px] font-semibold tracking-wide text-ground uppercase">
            {t('Shared.ProductCard.Paused')}
          </span>
        )}

        {/* Sale or rent, on the photograph. It is the first thing anybody
            filters by and the one fact that changes what the price means, so
            it does not wait its turn below the fold of the card. */}
        {property?.operation && (
          <span className="absolute top-2 left-2 rounded-pz-sm bg-ink/85 px-2 py-1 text-[11px] font-semibold text-ground">
            {t(`Vocabulary.Operation.${property.operation === 'rent' ? 'Rent' : 'Sale'}.Label`)}
          </span>
        )}

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

        {/* The service charge under the rent, because the two are paid
            together and a flat that is cheap until you read the second number
            is not cheap. Only when there is one. */}
        {property?.adminFee > 0 && (
          <span className="tabular text-xs text-faint">
            {property.adminIncluded
              ? t('Property.Specs.AdminIncluded')
              : `+ ${formatMoney(property.adminFee, product.currency)} ${t('Property.Specs.AdminFee').toLowerCase()}`}
          </span>
        )}

        <span className="tabular pt-0.5 text-sm font-medium text-ink">
          {propertySummary(t, property)}
        </span>

        <span className="line-clamp-2 text-sm leading-snug text-muted">{product.title}</span>

        <span className="mt-auto pt-1.5 text-xs text-faint">{where}</span>
      </span>
    </Link>
  )
}

export default PropertyCard
