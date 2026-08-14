import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Avatar, Button, Confirm, ShopLogo, Textarea } from '../../ui'
import { formatMoney } from '../../../utils/money'
import { notify } from '../../../utils/notify'
import orders from '../../../services/orders.services'
import { useResource } from '../../../hooks/useResource'

// Said from the buyer's side. The same row reads differently to the seller,
// which is why /sales has its own words for it rather than sharing these.
const STATUS = {
  pending: {
    label: 'Waiting on the seller',
    tone: 'bg-info-tint text-ink',
    note: 'They have been asked to confirm. Nothing is owed until they do.',
  },
  confirmed: {
    label: 'Confirmed',
    tone: 'bg-good-tint text-good',
    note: 'Agree the handover with them. You pay when you get it.',
  },
  delivered: {
    label: 'Delivered',
    tone: 'bg-sunk text-muted',
    note: null,
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'bg-sunk text-muted',
    note: null,
  },
}

const OPEN = ['pending', 'confirmed']

const Purchases = () => {
  const load = useCallback(() => orders.mine(), [])
  const { data, loading } = useResource(load, 'mine')

  const [list, setList] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const rows = list ?? data ?? []

  const cancel = async () => {
    setBusy(true)
    try {
      const updated = await orders.cancelPart(
        cancelling.orderId,
        cancelling.part.id,
        reason,
      )
      setList(rows.map(order => (order.id === updated.id ? updated : order)))
      notify('That part of the order was cancelled.', 'success')
      setCancelling(null)
      setReason('')
    } catch {
      // Reported by the interceptor.
    } finally {
      setBusy(false)
    }
  }

  if (loading && !list) {
    return (
      <div className="shell py-8 sm:py-10" aria-hidden>
        <div className="h-9 w-56 animate-pulse rounded-full bg-sunk" />
        <div className="panel mt-8 h-48 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="shell py-8 sm:py-10">
      <h1 className="rule-accent font-display text-3xl font-bold tracking-tight text-ink">
        Your purchases
      </h1>

      {rows.length === 0 ? (
        <div className="panel mt-8 flex flex-col items-center gap-4 px-6 py-16 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">Nothing bought yet</h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Orders you place show up here, one card per seller.
          </p>
          <Button.Action as={Link} to="/" size="sm" className="mt-1">Browse Plaza</Button.Action>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-8">
          {rows.map(order => (
            <li key={order.id} id={`order-${order.id}`}>
              <p className="tabular text-sm text-faint">
                Order #{order.id} · {new Date(order.createdAt).toLocaleDateString('es-CO')}
              </p>

              {/* One card per seller. An order that reached four people is four
                  agreements, each with its own answer and its own way out. */}
              <ul className="mt-3 flex flex-col gap-3">
                {order.suborders?.map(part => {
                  const status = STATUS[part.status] ?? {
                    label: part.status, tone: 'bg-sunk text-muted', note: null,
                  }

                  return (
                    <li key={part.id} className="panel p-5">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                        {part.shop ? (
                          <ShopLogo shop={part.shop} size="sm" />
                        ) : (
                          <Avatar account={part.seller} size="sm" />
                        )}

                        <div className="min-w-0 grow">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <span className="font-display text-base font-semibold text-ink">
                              {part.shop?.name ?? part.seller?.username}
                            </span>
                            <span className={clsx('rounded-pz-sm px-2 py-0.5 text-[11px] font-semibold', status.tone)}>
                              {status.label}
                            </span>
                          </div>
                          <p className="tabular mt-1 text-sm text-muted">
                            {formatMoney(part.subtotal, order.currency)}
                          </p>
                        </div>

                        {OPEN.includes(part.status) && (
                          <Button.Action
                            variant="ghost" color="danger" size="sm"
                            onClick={() => setCancelling({ orderId: order.id, part })}
                          >
                            Cancel
                          </Button.Action>
                        )}
                      </div>

                      <ul className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4">
                        {part.items?.map(item => (
                          <li key={item.id} className="tabular flex justify-between gap-4 text-sm">
                            <span className="min-w-0 text-ink">
                              {item.quantity > 1 && (
                                <span className="text-muted">{item.quantity} × </span>
                              )}
                              {item.title}
                            </span>
                            <span className="shrink-0 text-muted">
                              {formatMoney(Number(item.unitPrice) * item.quantity, order.currency)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* Who backed out, and why if they said. "Cancelled" on its
                          own does not tell you whether to wait or look elsewhere. */}
                      {part.status === 'cancelled' && (
                        <p className="mt-4 rounded-pz-sm border-l-[3px] border-line-strong bg-sunk px-4 py-3 text-sm leading-relaxed text-muted">
                          Cancelled by {part.cancelledBy === 'buyer' ? 'you' : 'the seller'}.
                          {part.cancelReason && <span className="text-ink"> {part.cancelReason}</span>}
                        </p>
                      )}

                      {status.note && (
                        <p className="mt-3 text-sm leading-relaxed text-muted">{status.note}</p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <Confirm
        open={Boolean(cancelling)}
        title="Cancel this part of the order?"
        body="The seller is told, and whatever they were holding goes back on sale. The rest of the order is untouched."
        confirmLabel="Cancel it"
        loading={busy}
        onConfirm={cancel}
        onCancel={() => { setCancelling(null); setReason('') }}
      >
        <Textarea
          label="Why, if you want to say" optional rows={3}
          placeholder="Found it closer to home."
          value={reason}
          onChange={event => setReason(event.target.value)}
        />
      </Confirm>
    </div>
  )
}

export default Purchases
