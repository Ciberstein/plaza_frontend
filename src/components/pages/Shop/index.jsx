import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPinIcon, TruckIcon } from '@heroicons/react/20/solid'
import { Button, ShopLogo } from '../../ui'
import { useMeta } from '../../../context/meta'
import shops from '../../../services/shops.services'
import { useResource } from '../../../hooks/useResource'

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
  const { slug } = useParams()
  const { cities, shipping } = useMeta()

  const load = useCallback(() => shops.storefront(slug), [slug])
  const { data: shop, error, loading } = useResource(load, slug)

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
          <h1 className="font-display text-xl font-semibold text-ink">No shop at this address</h1>
          <p className="text-sm leading-relaxed text-muted">
            It may have closed, or the link may be wrong.
          </p>
          <Button as={Link} to="/" variant="outline" size="sm">Back to Plaza</Button>
        </div>
      </div>
    )
  }

  const city = cities.find(c => c.value === shop.cityId)
  const delivery = shipping.find(s => s.value === shop.shipping)

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
        <h2 className="rule-accent font-display text-xl font-semibold text-ink">Products</h2>

        <div className="panel mt-6 px-6 py-16 text-center">
          <p className="text-sm text-muted">This shop has not listed anything yet.</p>
        </div>
      </section>
    </div>
  )
}

export default Shop
