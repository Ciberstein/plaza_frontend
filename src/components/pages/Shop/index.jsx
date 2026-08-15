import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { MapPinIcon, TruckIcon } from '@heroicons/react/20/solid'
import { Button, ShopLogo } from '../../ui'
import { useMeta } from '../../../context/meta'
import ListingCard from '../../shared/ListingCard'
import products from '../../../services/products.services'
import shops from '../../../services/shops.services'
import { useResource } from '../../../hooks/useResource'
import { withShopShippingLabels } from '../../../utils/vocabulary'

// One fact about the shop: where it is, how it ships. Aliased inside the body
// rather than renamed in the parameter list, because the lint rule that lets
// uppercase names through for JSX only covers variables, not arguments.
const Fact = ({ icon, children }) => {
  const Icon = icon

  return (
    <span className="flex items-center gap-1.5 text-sm text-muted">
      <Icon className="size-4 shrink-0 text-faint" />
      {children}
    </span>
  )
}

const Shop = () => {
  const { t } = useTranslation()
  const { slug } = useParams()
  const { cities, shipping: rawShipping } = useMeta()

  const load = useCallback(() => shops.storefront(slug), [slug])
  const { data: shop, error, loading } = useResource(load, slug)

  // Asked for separately, and only once the shop resolved: the catalogue is
  // keyed by the shop's id, which the slug in the URL does not carry.
  const loadStock = useCallback(
    () => (shop ? products.browse({ shopId: shop.id }) : Promise.resolve([])),
    [shop],
  )
  const { data: stock, loading: loadingStock } = useResource(loadStock, String(shop?.id ?? ''))

  if (loading) {
    return (
      <div className="shell py-8 sm:py-10" aria-hidden>
        <div className="panel flex flex-wrap items-start gap-6 p-6">
          <div className="size-24 animate-pulse rounded-pz bg-sunk" />
          <div className="flex grow flex-col gap-3 pt-2">
            <div className="h-7 w-64 animate-pulse rounded-full bg-sunk" />
            <div className="h-3.5 w-full max-w-md animate-pulse rounded-full bg-sunk" />
            <div className="h-3.5 w-40 animate-pulse rounded-full bg-sunk" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !shop) {
    return (
      <div className="shell py-8 sm:py-10">
        <div className="panel mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
          <h1 className="font-display text-xl font-semibold text-ink">{t('Shop.NotFound.Title')}</h1>
          <p className="text-sm leading-relaxed text-muted">
            {t('Shop.NotFound.Body')}
          </p>
          <Button.Action as={Link} to="/" variant="outline" color="neutral" size="sm">{t('Common.BackToPlaza')}</Button.Action>
        </div>
      </div>
    )
  }

  const city = cities.find(c => c.value === shop.cityId)
  const delivery = withShopShippingLabels(t, rawShipping).find(s => s.value === shop.shipping)

  return (
    <div className="shell flex flex-col gap-8 py-8 sm:py-10">
      <header className="flex flex-wrap items-start gap-5 sm:gap-7">
        <ShopLogo shop={shop} size="lg" />

        <div className="min-w-0 grow">
          <h1 className="font-display text-3xl leading-tight font-bold tracking-tight text-ink sm:text-4xl">
            {shop.name}
          </h1>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
            {city && <Fact icon={MapPinIcon}>{city.label}, {city.subtitle}</Fact>}
            {delivery && <Fact icon={TruckIcon}>{delivery.label}</Fact>}
          </div>

          {shop.description && (
            <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-muted">
              {shop.description}
            </p>
          )}
        </div>
      </header>

      <section>
        <h2 className="rule-accent font-display text-xl font-semibold text-ink">{t('Shop.ProductsTitle')}</h2>

        {loadingStock ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-hidden>
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
        ) : (stock ?? []).length === 0 ? (
          <div className="panel mt-6 px-6 py-16 text-center">
            <p className="text-sm text-muted">{t('Shop.NoProducts')}</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {stock.map((product, i) => (
              <ListingCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Shop
