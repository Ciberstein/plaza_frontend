import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPinIcon, TruckIcon } from '@heroicons/react/20/solid'
import { Awning, Button } from '../../ui'
import { useMeta } from '../../../context/meta'
import shops from '../../../services/shops.services'
import { useResource } from '../../../hooks/useResource'

const Shop = () => {
  const { slug } = useParams()
  const { cities, shipping } = useMeta()
  const load = useCallback(() => shops.storefront(slug), [slug])
  const { data: shop, error, loading } = useResource(load, slug)

  if (loading) return <p className="text-sm text-plaza-mute">Loading the shop…</p>

  if (error || !shop) {
    return (
      <div className="rounded-plaza border border-dashed border-plaza-line p-10 text-center">
        <h1 className="font-semibold">No shop at this address</h1>
        <p className="mt-1 text-sm text-plaza-mute">
          It may have closed, or the link may be wrong.
        </p>
        <Button variant="quiet" className="mt-4" as={Link} to="/">
          Back to the square
        </Button>
      </div>
    )
  }

  const city = cities.find(c => c.value === shop.city)
  const delivery = shipping.find(s => s.value === shop.shipping)

  return (
    <div className="flex flex-col gap-6">
      <header className="overflow-hidden rounded-plaza border border-plaza-line bg-plaza-paper">
        {/* The same awning the card wore, so arriving here confirms you reached
            the shop you clicked. */}
        <Awning seed={shop.slug} className="h-2" />

        <div className="flex flex-col gap-3 p-6">
          <h1 className="text-2xl font-bold tracking-tight">{shop.name}</h1>

          {shop.description && (
            <p className="max-w-2xl text-sm text-plaza-mute">{shop.description}</p>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-plaza-mute">
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
        <h2 className="mb-3 text-lg font-semibold tracking-tight">What they sell</h2>
        <div className="rounded-plaza border border-dashed border-plaza-line p-10 text-center text-sm text-plaza-mute">
          This shop has not listed anything yet.
        </div>
      </section>
    </div>
  )
}

export default Shop
