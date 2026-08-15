import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Avatar, Button, Confirm, ShopLogo, Textarea } from '../../ui'
import Contact from '../../shared/Contact'
import RatingForm from '../../shared/RatingForm'
import ratings from '../../../services/ratings.services'
import { useLanguage } from '../../../context/language'
import { formatDate } from '../../../utils/date'
import { formatMoney } from '../../../utils/money'
import { notify } from '../../../utils/notify'
import orders from '../../../services/orders.services'
import { useResource } from '../../../hooks/useResource'

// Said from the buyer's side. The same row reads differently to the seller,
// which is why /sales has its own words for it rather than sharing these.
// Built from `t` rather than held as a module-level constant, because the
// active language is not known until render.
const statusOf = (t, status) => {
  const table = {
    pending: {
      label: t('Purchases.Status.Pending.Label'),
      tone: 'bg-info-tint text-ink',
      note: t('Purchases.Status.Pending.Note'),
    },
    confirmed: {
      label: t('Purchases.Status.Confirmed.Label'),
      tone: 'bg-good-tint text-good',
      // The one place a buyer finds out they are committed. Said here rather
      // than left to the missing button, which explains nothing.
      note: t('Purchases.Status.Confirmed.Note'),
    },
    delivered: {
      label: t('Purchases.Status.Delivered.Label'),
      tone: 'bg-sunk text-muted',
      note: null,
    },
    cancelled: {
      label: t('Purchases.Status.Cancelled.Label'),
      tone: 'bg-sunk text-muted',
      note: null,
    },
  }

  return table[status] ?? { label: status, tone: 'bg-sunk text-muted', note: null }
}

// Only while the seller has not answered. Once they accept, they have set
// stock aside for it, and the way out is theirs to offer. Enforced by the API;
// this is the button matching the rule rather than inventing it.
const BUYER_MAY_CANCEL = ['pending']

const Purchases = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const load = useCallback(() => orders.mine(), [])
  const { data, loading } = useResource(load, 'mine')

  const [list, setList] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [receiving, setReceiving] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  // Which of these have already been rated. Held apart from the orders
  // themselves because it answers a question about this reader, not about the
  // order: two people looking at the same purchase see different buttons.
  const [said, setSaid] = useState({ ratedParts: [], reviewed: [] })
  // Which card is currently showing a form, so only one is open at a time.
  const [rating, setRating] = useState(null)

  useEffect(() => {
    let ignore = false
    ratings
      .mine()
      .then(mine => { if (!ignore) setSaid(mine) })
      // An empty answer is the right fallback: the worst case is offering a
      // button that the server then refuses, which it says plainly.
      .catch(() => {})
    return () => { ignore = true }
  }, [])

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
      notify(t('Purchases.Cancelled'), 'success')
      setCancelling(null)
      setReason('')
    } catch {
      // Reported by the interceptor.
    } finally {
      setBusy(false)
    }
  }

  const received = async () => {
    setBusy(true)
    try {
      const updated = await orders.markReceived(receiving.orderId, receiving.part.id)
      setList(rows.map(order => (order.id === updated.id ? updated : order)))
      notify(t('Purchases.MarkReceivedNotify'), 'success')
      setReceiving(null)
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
        {t('Purchases.Title')}
      </h1>

      {rows.length === 0 ? (
        <div className="panel mt-8 flex flex-col items-center gap-4 px-6 py-16 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">{t('Purchases.Empty.Title')}</h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            {t('Purchases.Empty.Body')}
          </p>
          <Button.Action as={Link} to="/" size="sm" className="mt-1">{t('Common.BrowsePlaza')}</Button.Action>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-8">
          {rows.map(order => (
            <li key={order.id} id={`order-${order.id}`}>
              <p className="tabular text-sm text-faint">
                {t('Purchases.OrderNumber', { id: order.id })} · {formatDate(order.createdAt, language)}
              </p>

              {/* One card per seller. An order that reached four people is four
                  agreements, each with its own answer and its own way out. */}
              <ul className="mt-3 flex flex-col gap-3">
                {order.suborders?.map(part => {
                  const status = statusOf(t, part.status)

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

                        {BUYER_MAY_CANCEL.includes(part.status) && (
                          <Button.Action
                            variant="ghost" color="danger" size="sm"
                            onClick={() => setCancelling({ orderId: order.id, part })}
                          >
                            {t('Purchases.CancelAction')}
                          </Button.Action>
                        )}

                        {/* The buyer's own way to close it. Without this the
                            seller decided whether they could ever be rated. */}
                        {part.status === 'confirmed' && (
                          <Button.Action
                            variant="outline" color="neutral" size="sm"
                            onClick={() => setReceiving({ orderId: order.id, part })}
                          >
                            {t('Purchases.MarkReceived')}
                          </Button.Action>
                        )}

                        {part.status === 'delivered' && (
                          said.ratedParts.includes(part.id) ? (
                            <span className="text-sm text-faint">{t('Ratings.Rate.Done')}</span>
                          ) : (
                            <Button.Action
                              variant="outline" size="sm"
                              onClick={() => setRating({ target: 'seller', partId: part.id })}
                            >
                              {t('Ratings.Rate.Seller')}
                            </Button.Action>
                          )
                        )}
                      </div>

                      <ul className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4">
                        {part.items?.map(item => (
                          <li key={item.id} className="tabular flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
                            <span className="min-w-0 text-ink">
                              {item.quantity > 1 && (
                                <span className="text-muted">{item.quantity} × </span>
                              )}
                              {item.title}
                            </span>

                            <span className="flex items-baseline gap-3">
                              {/* Per line, because a review is about the thing
                                  and an order can hold four different ones.
                                  Only where the listing still exists: a review
                                  needs a page to sit on. */}
                              {part.status === 'delivered' && item.productId && (
                                said.reviewed.includes(item.productId) ? (
                                  <span className="text-xs text-faint">{t('Ratings.Rate.Reviewed')}</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setRating({ target: 'product', productId: item.productId })}
                                    className="cursor-pointer text-xs font-medium text-link hover:underline"
                                  >
                                    {t('Ratings.Rate.Product')}
                                  </button>
                                )
                              )}
                              <span className="shrink-0 text-muted">
                                {formatMoney(Number(item.unitPrice) * item.quantity, order.currency)}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* Only present once the seller confirmed: until then the
                          server does not send it. Placing an order must not be
                          a way to collect people's contact details. */}
                      <Contact
                        who="seller"
                        email={part.seller?.email}
                        phone={part.seller?.phone}
                      />

                      {/* Who backed out, and why if they said. "Cancelled" on its
                          own does not tell you whether to wait or look elsewhere. */}
                      {part.status === 'cancelled' && (
                        <p className="mt-4 rounded-pz-sm border-l-[3px] border-line-strong bg-sunk px-4 py-3 text-sm leading-relaxed text-muted">
                          {t('Purchases.CancelledByText', {
                            who: t(part.cancelledBy === 'buyer' ? 'Purchases.CancelledBy.You' : 'Purchases.CancelledBy.Seller'),
                          })}
                          {part.cancelReason && <span className="text-ink"> {part.cancelReason}</span>}
                        </p>
                      )}

                      {/* Opened under the card it belongs to rather than in a
                          dialog: the thing being judged should stay on screen
                          while somebody decides what they thought of it. */}
                      {rating && (
                        (rating.target === 'seller' && rating.partId === part.id) ||
                        (rating.target === 'product' &&
                          part.items?.some(i => i.productId === rating.productId))
                      ) && (
                        <div className="mt-4">
                          <RatingForm
                            target={rating.target}
                            subOrderId={rating.partId}
                            productId={rating.productId}
                            onCancel={() => setRating(null)}
                            onDone={() => {
                              setSaid(current =>
                                rating.target === 'seller'
                                  ? { ...current, ratedParts: [...current.ratedParts, rating.partId] }
                                  : { ...current, reviewed: [...current.reviewed, rating.productId] },
                              )
                              setRating(null)
                            }}
                          />
                        </div>
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
        open={Boolean(receiving)}
        title={t('Purchases.ConfirmReceived.Title')}
        body={t('Purchases.ConfirmReceived.Body')}
        confirmLabel={t('Purchases.ConfirmReceived.Label')}
        confirmColor="primary"
        loading={busy}
        onConfirm={received}
        onCancel={() => setReceiving(null)}
      />

      <Confirm
        open={Boolean(cancelling)}
        title={t('Purchases.ConfirmCancel.Title')}
        body={t('Purchases.ConfirmCancel.Body')}
        confirmLabel={t('Purchases.ConfirmCancel.Label')}
        loading={busy}
        onConfirm={cancel}
        onCancel={() => { setCancelling(null); setReason('') }}
      >
        <Textarea
          label={t('Purchases.Reason.Label')} optional rows={3}
          placeholder={t('Purchases.Reason.Placeholder')}
          value={reason}
          onChange={event => setReason(event.target.value)}
        />
      </Confirm>
    </div>
  )
}

export default Purchases
