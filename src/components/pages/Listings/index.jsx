import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { PhotoIcon } from '@heroicons/react/24/outline'
import { Button, Confirm } from '../../ui'
import { formatMoney } from '../../../utils/money'
import { notify } from '../../../utils/notify'
import products from '../../../services/products.services'
import { useResource } from '../../../hooks/useResource'

// What each state means for the seller and what happens next, in their words.
// "Draft" on its own tells someone nothing about why nobody can see their
// listing or what to do about it.
const STATUS = {
  draft: {
    label: 'Draft',
    tone: 'bg-sunk text-muted',
    note: 'Only you can see this. Publish it when the photos are ready.',
  },
  active: {
    label: 'Published',
    tone: 'bg-good-tint text-good',
    note: null,
  },
  paused: {
    label: 'Paused',
    tone: 'bg-sunk text-muted',
    note: 'Hidden by you. Set it back to available on the listing itself.',
  },
  out_of_stock: {
    label: 'Out of stock',
    tone: 'bg-info-tint text-ink',
    note: 'Still listed, but nobody can buy it until you add stock.',
  },
  archived: {
    label: 'Archived',
    tone: 'bg-sunk text-muted',
    note: 'Taken off the square. You can publish it again whenever you want.',
  },
}

const Listings = () => {
  const load = useCallback(() => products.mine(), [])
  const { data, loading } = useResource(load, 'mine')

  const [list, setList] = useState(null)
  const [busy, setBusy] = useState(null)
  // The listing waiting on an answer, not a boolean: the dialog needs its title
  // to say which one is about to go.
  const [deleting, setDeleting] = useState(null)

  const rows = list ?? data ?? []

  const run = async (product, action, message) => {
    setBusy(product.id)
    try {
      const updated = await products[action](product.id)
      setList(rows.map(row => (row.id === updated.id ? updated : row)))
      notify(message(updated), 'success')
    } catch {
      // The interceptor has already said what went wrong, and for publish that
      // message is the list of things still missing.
    } finally {
      setBusy(null)
    }
  }

  const remove = async () => {
    setBusy(deleting.id)
    try {
      await products.remove(deleting.id)
      setList(rows.filter(row => row.id !== deleting.id))
      notify(`${deleting.title} was deleted.`, 'success')
      setDeleting(null)
    } catch {
      // Reported by the interceptor. The dialog stays open so the person can
      // see what happened without the row vanishing underneath them.
    } finally {
      setBusy(null)
    }
  }

  const actions = (product) => {
    const working = busy === product.id

    if (['active', 'paused', 'out_of_stock'].includes(product.status)) {
      return (
        <Button.Action variant="ghost" size="sm" loading={working}
          onClick={() => run(product, 'archive', p => `${p.title} was archived.`)}>
          Archive
        </Button.Action>
      )
    }

    return (
      <Button.Action size="sm" loading={working}
        onClick={() => run(product, 'publish', p => `${p.title} is live.`)}>
        Publish
      </Button.Action>
    )
  }

  return (
    <div className="shell py-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="max-w-prose">
          <h1 className="rule-accent font-display text-3xl font-bold tracking-tight text-ink">
            Your listings
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Everything you sell, under your own name or under one of your shops.
          </p>
        </div>
        <Button.Action as={Link} to="/listings/new" size="sm">List an item</Button.Action>
      </div>

      <div className="mt-8">
        {loading && !list ? (
          <div className="panel divide-y divide-line" aria-hidden>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="size-16 animate-pulse rounded-pz bg-sunk" />
                <div className="flex grow flex-col gap-2">
                  <div className="h-4 w-56 animate-pulse rounded-full bg-sunk" />
                  <div className="h-2.5 w-24 animate-pulse rounded-full bg-sunk" />
                </div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="panel flex flex-col items-center gap-4 px-6 py-16 text-center">
            <h2 className="font-display text-xl font-semibold text-ink">Nothing listed yet</h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              A listing needs a photo, a price and a category. It stays a draft until
              you publish it.
            </p>
            <Button.Action as={Link} to="/listings/new" size="sm" className="mt-1">List an item</Button.Action>
          </div>
        ) : (
          <ul className="panel divide-y divide-line">
            {rows.map(product => {
              const status = STATUS[product.status] ?? {
                label: product.status,
                tone: 'bg-sunk text-muted',
                note: null,
              }
              const cover = product.images?.[0]?.url

              return (
                <li key={product.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        className="size-16 shrink-0 rounded-pz object-cover"
                      />
                    ) : (
                      // The missing photo is the most common reason publishing
                      // is refused, so the row says so before the seller tries.
                      <span className="flex size-16 shrink-0 items-center justify-center rounded-pz bg-sunk text-faint">
                        <PhotoIcon className="size-6" />
                      </span>
                    )}

                    <div className="min-w-0 grow">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <Link
                          to={`/listings/${product.id}`}
                          className="font-display text-base font-semibold text-ink hover:underline"
                        >
                          {product.title}
                        </Link>
                        <span className={clsx('rounded-pz-sm px-2 py-0.5 text-[11px] font-semibold', status.tone)}>
                          {status.label}
                        </span>
                      </div>
                      <p className="tabular mt-1 text-sm text-muted">
                        {formatMoney(product.price, product.currency)}
                        <span className="text-faint"> · {product.stock} in stock</span>
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button.Action as={Link} to={`/listings/${product.id}`} variant="outline" color="neutral" size="sm">
                        Edit
                      </Button.Action>
                      {actions(product)}
                      <Button.Action
                        variant="ghost" color="danger" size="sm"
                        onClick={() => setDeleting(product)}
                      >
                        Delete
                      </Button.Action>
                    </div>
                  </div>

                  {status.note && (
                    <p className="mt-3 text-sm leading-relaxed text-muted">{status.note}</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Confirm
        open={Boolean(deleting)}
        title={`Delete ${deleting?.title ?? 'this listing'}?`}
        body="The listing and its photos go for good. Anything already sold keeps its record. To take it off the square without losing it, archive it instead."
        confirmLabel="Delete listing"
        loading={busy === deleting?.id}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

export default Listings
