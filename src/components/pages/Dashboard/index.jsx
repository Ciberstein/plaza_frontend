import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Awning, Button } from '../../ui'
import { useMeta } from '../../../context/meta'
import { notify } from '../../../utils/notify'
import shops from '../../../services/shops.services'

// What each state means to the seller, in their words rather than the column's.
const STATUS = {
  draft: { label: 'Not published', tone: 'text-plaza-mute' },
  active: { label: 'Open', tone: 'text-plaza-pine' },
  suspended: { label: 'Suspended', tone: 'text-plaza-clay' },
  closed: { label: 'Closed', tone: 'text-plaza-mute' },
}

const Dashboard = () => {
  const { cities } = useMeta()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)

  // Loading starts true rather than being raised inside the effect: there is
  // exactly one load here, and setting state synchronously in an effect costs a
  // whole extra render pass.
  useEffect(() => {
    let ignore = false

    shops
      .mine()
      .then(data => { if (!ignore) setList(data) })
      .catch(() => { if (!ignore) setList([]) })
      .finally(() => { if (!ignore) setLoading(false) })

    return () => { ignore = true }
  }, [])

  const setStatus = async (shop, status) => {
    setBusy(shop.id)
    try {
      const updated = await shops.update(shop.id, { status })
      setList(current => current.map(s => (s.id === updated.id ? updated : s)))
      notify(
        status === 'active'
          ? `${updated.name} is open. It now shows in the square.`
          : `${updated.name} is no longer listed.`,
        'success',
      )
    } catch {
      // Already reported by the response interceptor.
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your shops</h1>
          <p className="mt-1 text-sm text-plaza-mute">
            A shop stays private until you publish it.
          </p>
        </div>
        <Button as={Link} to="/sell">Open another shop</Button>
      </div>

      {loading ? (
        <p className="text-sm text-plaza-mute">Loading your shops…</p>
      ) : list.length === 0 ? (
        <div className="rounded-plaza border border-dashed border-plaza-line p-10 text-center">
          <p className="text-sm text-plaza-mute">You have not opened a shop yet.</p>
          <Button variant="accent" className="mt-4" as={Link} to="/sell">
            Open your shop
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map(shop => {
            const status = STATUS[shop.status] ?? { label: shop.status, tone: 'text-plaza-mute' }
            const city = cities.find(c => c.value === shop.city)

            return (
              <li
                key={shop.id}
                className="overflow-hidden rounded-plaza border border-plaza-line bg-plaza-paper"
              >
                <Awning seed={shop.slug} />

                <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <h2 className="font-semibold tracking-tight">{shop.name}</h2>
                    <p className="mt-0.5 text-xs text-plaza-mute">
                      /s/{shop.slug}
                      {city ? ` · ${city.label}` : ''}
                    </p>
                    <p className={`mt-1 text-xs font-medium ${status.tone}`}>{status.label}</p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {shop.status === 'active' ? (
                      <>
                        <Button variant="quiet" size="sm" as={Link} to={`/s/${shop.slug}`}>
                          View storefront
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={busy === shop.id}
                          onClick={() => setStatus(shop, 'draft')}
                        >
                          Unpublish
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="accent"
                        size="sm"
                        loading={busy === shop.id}
                        disabled={shop.status === 'suspended'}
                        onClick={() => setStatus(shop, 'active')}
                      >
                        Publish
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default Dashboard
