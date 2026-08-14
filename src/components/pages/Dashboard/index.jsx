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
//
// Blue is the tone for anything waiting on someone else. It cannot be green,
// which on this page always means "done" or "you can act on this", and it
// cannot be red, which always means something failed.
const STATUS = {
  draft: {
    label: 'Draft',
    tone: 'bg-sunk text-muted',
    note: 'Only you can see this. Send it for review when it is ready.',
  },
  pending: {
    label: 'Waiting for review',
    tone: 'bg-info text-on-info',
    note: 'Someone from Plaza is checking it. You cannot edit it until they do.',
  },
  rejected: {
    label: 'Changes needed',
    tone: 'bg-alert-tint text-alert',
    note: null,
  },
  active: {
    label: 'Open',
    tone: 'bg-good-tint text-good',
    note: null,
  },
  suspended: {
    label: 'Suspended',
    tone: 'bg-alert-tint text-alert',
    note: 'Plaza took this shop down. Reply to the email we sent to sort it out.',
  },
  closed: {
    label: 'Closed',
    tone: 'bg-sunk text-muted',
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
          <Button variant="outline" size="sm" loading={working}
            onClick={() => run(shop, 'withdraw', s => `${s.name} was taken out of the queue.`)}>
            Withdraw
          </Button>
        )
      case 'active':
        return (
          <>
            <Button variant="outline" size="sm" as={Link} to={`/s/${shop.slug}`}>
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
    <div className="shell py-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="max-w-prose">
          <h1 className="rule-accent font-display text-3xl font-bold tracking-tight text-ink">
            Your shops
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            You can sell under your own name without any of this. A shop is a brand,
            and Plaza reviews it before it opens.
          </p>
        </div>
        <Button as={Link} to="/sell/shop" size="sm">Request a shop</Button>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="panel divide-y divide-line" aria-hidden>
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 p-5">
                <div className="size-11 animate-pulse rounded-pz bg-sunk" />
                <div className="flex grow flex-col gap-2">
                  <div className="h-4 w-48 animate-pulse rounded-full bg-sunk" />
                  <div className="h-2.5 w-32 animate-pulse rounded-full bg-sunk" />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="panel flex flex-col items-center gap-4 px-6 py-16 text-center">
            <h2 className="font-display text-xl font-semibold text-ink">No shops yet</h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              A shop gives what you sell a name and a storefront of its own.
            </p>
            <Button as={Link} to="/sell/shop" size="sm" className="mt-1">Request a shop</Button>
          </div>
        ) : (
          // One panel with rules between the rows, rather than a stack of
          // separate cards. Six shadowed boxes in a column read as six unrelated
          // things; a divided list reads as one list, which is what it is.
          <ul className="panel divide-y divide-line">
            {list.map(shop => {
              const status = STATUS[shop.status] ?? {
                label: shop.status,
                tone: 'bg-sunk text-muted',
                note: null,
              }

              return (
                <li key={shop.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <ShopLogo shop={shop} size="sm" />

                    <div className="min-w-0 grow">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h2 className="font-display text-base font-semibold text-ink">
                          {shop.name}
                        </h2>
                        <span className={clsx('rounded-pz-sm px-2 py-0.5 text-[11px] font-semibold', status.tone)}>
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-faint">
                        {[`/s/${shop.slug}`, labelFor(cities, shop.cityId)].filter(Boolean).join(' · ')}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">{actions(shop)}</div>
                  </div>

                  {/* The reviewer's reason, in full. A refusal without it leaves the
                      seller guessing and guarantees an identical resubmission. */}
                  {shop.reviewNote && ['rejected', 'suspended'].includes(shop.status) && (
                    <p className="mt-4 rounded-pz-sm border-l-[3px] border-alert bg-alert-tint px-4 py-3 text-sm leading-relaxed text-ink">
                      {shop.reviewNote}
                    </p>
                  )}

                  {status.note && (
                    <p className="mt-3 text-sm leading-relaxed text-muted">{status.note}</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Dashboard
