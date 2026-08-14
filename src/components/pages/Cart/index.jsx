import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MinusIcon, PhotoIcon, PlusIcon, TrashIcon } from '@heroicons/react/20/solid'
import { Button, Confirm } from '../../ui'
import { useCart } from '../../../context/cart'
import { formatMoney } from '../../../utils/money'
import { notify } from '../../../utils/notify'
import cart from '../../../services/cart.services'
import orders from '../../../services/orders.services'
import { useResource } from '../../../hooks/useResource'

/**
 * The basket.
 *
 * The server owns it, so this page asks and then does as it is told. It does
 * not decide what may stay: a listing its seller paused is deleted server-side
 * on read, and this simply gets a shorter list back and says how much shorter.
 */
const Cart = () => {
  const { refresh } = useCart()
  const navigate = useNavigate()

  const [round, setRound] = useState(0)
  const [busy, setBusy] = useState(false)
  const [asking, setAsking] = useState(false)

  // The round is bumped after every change, which is what asks the hook to
  // fetch again. Amounts and totals are the server's answer, never a guess made
  // here and reconciled later.
  const load = useCallback(() => cart.list(), [])
  const { data, loading } = useResource(load, String(round))

  const items = data?.items ?? []
  const removed = data?.removed ?? 0

  const again = async () => {
    setRound(n => n + 1)
    await refresh()
  }

  const change = async (productId, quantity) => {
    setBusy(true)
    try {
      await cart.setQuantity(productId, quantity)
      await again()
    } catch {
      // Reported by the interceptor, which names the amount left.
    } finally {
      setBusy(false)
    }
  }

  const drop = async (productId) => {
    setBusy(true)
    try {
      await cart.remove(productId)
      await again()
    } catch {
      // Reported by the interceptor.
    } finally {
      setBusy(false)
    }
  }

  const place = async () => {
    setAsking(false)
    setBusy(true)
    try {
      const order = await orders.place(
        items.map(line => ({ productId: line.productId, quantity: line.quantity })),
      )
      // Emptied on the server as part of placing it, so this only catches up.
      await again()
      notify('Order placed. Each seller has been asked to confirm.', 'success')
      navigate(`/purchases#order-${order.id}`)
    } catch {
      // Reported by the interceptor, which names whatever ran out.
    } finally {
      setBusy(false)
    }
  }

  const total = items.reduce(
    (sum, line) => sum + Number(line.product.price) * line.quantity,
    0,
  )
  const currency = items[0]?.product?.currency ?? 'COP'
  const overStock = items.filter(line => line.quantity > line.product.stock)

  if (loading) {
    return (
      <div className="shell py-8 sm:py-10" aria-hidden>
        <div className="h-9 w-40 animate-pulse rounded-full bg-sunk" />
        <div className="panel mt-8 h-64 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="shell py-8 sm:py-10">
      <h1 className="rule-accent font-display text-3xl font-bold tracking-tight text-ink">
        Your cart
      </h1>

      {/* Said, not silently done. A basket shorter than you left it has to
          explain itself, or the site looks like it lost something. */}
      {removed > 0 && (
        <p className="mt-6 rounded-pz border border-line border-l-[3px] border-l-info bg-sunk px-4 py-3 text-sm text-ink">
          {removed === 1
            ? 'One listing was withdrawn by its seller and left your cart.'
            : `${removed} listings were withdrawn by their sellers and left your cart.`}
        </p>
      )}

      {items.length === 0 ? (
        <div className="panel mt-8 flex flex-col items-center gap-4 px-6 py-16 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">Nothing in it yet</h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Things you add stay here until you order them.
          </p>
          <Button.Action as={Link} to="/" size="sm" className="mt-1">Browse Plaza</Button.Action>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <ul className="panel divide-y divide-line h-min">
            {items.map(({ productId, quantity, product }) => (
              <li key={productId} className="flex flex-wrap items-center gap-4 p-4">
                {product.cover ? (
                  <img
                    src={product.cover}
                    alt=""
                    className="size-20 shrink-0 rounded-sm object-cover"
                  />
                ) : (
                  <span className="flex size-20 shrink-0 items-center justify-center rounded-pz bg-sunk text-faint">
                    <PhotoIcon className="size-7" />
                  </span>
                )}

                <div className="min-w-0 grow">
                  <Link
                    to={`/p/${productId}`}
                    className="font-display text-base font-semibold text-ink hover:underline"
                  >
                    {product.title}
                  </Link>
                  <p className="tabular mt-1 text-sm text-muted">
                    {formatMoney(product.price, product.currency)}
                    <span className="text-faint">
                      {' · '}
                      {product.shop?.name ?? product.seller?.username}
                    </span>
                    {quantity > product.stock && (
                      <span className="ml-2 font-medium text-alert">
                        only {product.stock} left
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1 rounded-pz-sm border border-line-strong">
                  <Button.Icon
                    size="sm" disabled={busy} aria-label="One fewer"
                    onClick={() => change(productId, quantity - 1)}
                  >
                    <MinusIcon className="size-4" />
                  </Button.Icon>
                  <span className="tabular w-8 text-center text-sm font-medium text-ink">
                    {quantity}
                  </span>
                  <Button.Icon
                    size="sm" aria-label="One more"
                    disabled={busy || quantity >= product.stock}
                    onClick={() => change(productId, quantity + 1)}
                  >
                    <PlusIcon className="size-4" />
                  </Button.Icon>
                </div>

                <Button.Icon
                  color="danger" size="sm" disabled={busy} aria-label="Remove from cart"
                  onClick={() => drop(productId)}
                >
                  <TrashIcon className="size-4" />
                </Button.Icon>
              </li>
            ))}
          </ul>

          <div className="panel h-fit p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Summary</h2>

            <p className="tabular mt-4 flex items-baseline justify-between">
              <span className="text-sm text-muted">
                {items.length} {items.length === 1 ? 'listing' : 'listings'}
              </span>
              <span className="font-display text-2xl font-semibold text-ink">
                {formatMoney(total, currency)}
              </span>
            </p>

            <p className="mt-4 text-xs leading-relaxed text-faint">
              Nothing is paid here. Each seller confirms their part and you settle it
              with them on handover.
            </p>

            <Button.Action
              size="lg" full className="mt-5"
              loading={busy}
              disabled={overStock.length > 0}
              onClick={() => setAsking(true)}
            >
              Place order
            </Button.Action>

            {overStock.length > 0 && (
              <p className="mt-3 text-xs leading-relaxed text-alert">
                Lower the amounts that ran short before ordering.
              </p>
            )}
          </div>
        </div>
      )}

      {/* One question for the whole basket, not one per seller. The commitment
          is the same on each part of it. */}
      <Confirm
        open={asking}
        title="Place this order?"
        body="You can call this off freely while the seller has not answered. Once they accept, they set the item aside for you and only they can cancel it. Nothing is paid through Plaza: you settle with them on handover."
        confirmLabel="Place order"
        confirmColor="primary"
        loading={busy}
        onConfirm={place}
        onCancel={() => setAsking(false)}
      />
    </div>
  )
}

export default Cart
