import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPinIcon, TruckIcon } from '@heroicons/react/20/solid'
import { Button, ShopLogo } from '../../ui'
import { useMeta } from '../../../context/meta'
import shops from '../../../services/shops.services'
import { useResource } from '../../../hooks/useResource'

const Shop = () => {
  const { slug } = useParams()
  const { cities, shipping } = useMeta()

  const load = useCallback(() => shops.storefront(slug), [slug])
  const { data: shop, error, loading } = useResource(load, slug)

  if (loading) return <div className="card h-44 animate-pulse" />

  if (error || !shop) {
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
        <h1 className="font-medium">No shop at this address</h1>
        <p className="text-sm text-plaza-muted">
          It may have closed, or the link may be wrong.
        </p>
        <Button as={Link} to="/" variant="secondary" size="sm">Back to Plaza</Button>
      </div>
    )
  }

  const city = cities.find(c => c.value === shop.cityId)
  const delivery = shipping.find(s => s.value === shop.shipping)

  return (
    <div className="flex flex-col gap-5">
      <header className="card flex flex-wrap items-start gap-5 p-6">
        <ShopLogo shop={shop} size="lg" />

        <div className="min-w-0 grow">
          <h1 className="text-2xl font-medium text-plaza-ink">{shop.name}</h1>

          {shop.description && (
            <p className="mt-3 max-w-2xl text-sm text-plaza-ink">{shop.description}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-plaza-muted">
            {city && (
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="size-4" />
                {city.label}, {city.subtitle}
              </span>
            )}
            {delivery && (
              <span className="flex items-center gap-1.5">
                <TruckIcon className="size-4" />
                {delivery.label}
              </span>
            )}
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-medium">Products</h2>
        <div className="card px-6 py-14 text-center text-sm text-plaza-muted">
          This shop has not listed anything yet.
        </div>
      </section>
    </div>
  )
}

export default Shop
