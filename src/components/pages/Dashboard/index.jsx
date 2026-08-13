import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Button, ShopLogo } from '../../ui'
import { useMeta } from '../../../context/meta'
import { notify } from '../../../utils/notify'
import shops from '../../../services/shops.services'

// Each state says what it means for the seller and what happens next, in their
// words. "Draft" on its own tells someone nothing about why their shop is
// invisible or what to do about it.
const STATUS = {
  draft: {
    label: 'Draft',
    tone: 'bg-plaza-hover text-plaza-muted',
    note: 'Only you can see this. Send it for review when it is ready.',
  },
  pending: {
    label: 'Waiting for review',
    tone: 'bg-plaza-deal/10 text-plaza-deal',
    note: 'Someone from Plaza is checking it. You cannot edit it until they do.',
  },
  rejected: {
    label: 'Changes needed',
    tone: 'bg-plaza-alert-tint text-plaza-alert',
    note: null,
  },
  active: {
    label: 'Open',
    tone: 'bg-plaza-action-tint text-plaza-action',
    note: null,
  },
  suspended: {
    label: 'Suspended',
    tone: 'bg-plaza-alert-tint text-plaza-alert',
    note: 'Plaza took this shop down. Reply to the email we sent to sort it out.',
  },
  closed: {
    label: 'Closed',
    tone: 'bg-plaza-hover text-plaza-muted',
    note: 'Not listed. You can open it again whenever you want.',
  },
}

const Dashboard = () => {
  const { cities } = useMeta()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    let ignore = false

    shops
      .mine()
      .then(data => { if (!ignore) setList(data) })
      .catch(() => { if (!ignore) setList([]) })
      .finally(() => { if (!ignore) setLoading(false) })

    return () => { ignore = true }
  }, [])

  const run = async (shop, action, message) => {
    setBusy(shop.id)
    try {
      const updated = await shops[action](shop.id)
      setList(current => current.map(s => (s.id === updated.id ? updated : s)))
      notify(message(updated), 'success')
    } catch {
      // Already reported by the response interceptor.
    } finally {
      setBusy(null)
    }
  }

  const labelFor = (source, value) => source.find(item => item.value === value)?.label

  // Going live is absent on purpose: it is not one of the seller's transitions.
  const actions = (shop) => {
    const working = busy === shop.id

    switch (shop.status) {
      case 'draft':
      case 'rejected':
        return (
          <Button size="sm" loading={working}
            onClick={() => run(shop, 'submit', s => `${s.name} was sent for review.`)}>
            Send for review
          </Button>
        )
      case 'pending':
        return (
          <Button variant="secondary" size="sm" loading={working}
            onClick={() => run(shop, 'withdraw', s => `${s.name} was taken out of the queue.`)}>
            Withdraw
          </Button>
        )
      case 'active':
        return (
          <>
            <Button variant="secondary" size="sm" as={Link} to={`/s/${shop.slug}`}>
              View storefront
            </Button>
            <Button variant="ghost" size="sm" loading={working}
              onClick={() => run(shop, 'close', s => `${s.name} is closed.`)}>
              Close
            </Button>
          </>
        )
      case 'closed':
        return (
          <Button size="sm" loading={working}
            onClick={() => run(shop, 'reopen', s => `${s.name} is open again.`)}>
            Open again
          </Button>
        )
      default:
        // Suspended. Nothing for the seller to do from here, by design.
        return null
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium">Your shops</h1>
          <p className="mt-0.5 text-sm text-plaza-muted">
            You can sell under your own name without any of this. A shop is a brand,
            and Plaza reviews it before it opens.
          </p>
        </div>
        <Button as={Link} to="/sell" size="sm">Open a shop</Button>
      </div>

      {loading ? (
        <div className="card h-24 animate-pulse" />
      ) : list.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <p className="text-sm text-plaza-muted">You have not opened a shop yet.</p>
          <Button as={Link} to="/sell" size="sm">Open a shop</Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map(shop => {
            const status = STATUS[shop.status] ?? {
              label: shop.status,
              tone: 'bg-plaza-hover text-plaza-muted',
              note: null,
            }

            return (
              <li key={shop.id} className="card p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <ShopLogo shop={shop} size="sm" />

                  <div className="min-w-0 grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-medium">{shop.name}</h2>
                      <span className={clsx('rounded-plaza px-2 py-0.5 text-xs font-medium', status.tone)}>
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-plaza-muted">
                      {[`/s/${shop.slug}`, labelFor(cities, shop.cityId)].filter(Boolean).join(' · ')}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">{actions(shop)}</div>
                </div>

                {/* The reviewer's reason, in full. A refusal without it leaves the
                    seller guessing and guarantees an identical resubmission. */}
                {shop.reviewNote && ['rejected', 'suspended'].includes(shop.status) && (
                  <p className="mt-3 border-l-2 border-plaza-alert bg-plaza-alert-tint px-3 py-2 text-sm text-plaza-ink">
                    {shop.reviewNote}
                  </p>
                )}

                {status.note && <p className="mt-3 text-sm text-plaza-muted">{status.note}</p>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default Dashboard
