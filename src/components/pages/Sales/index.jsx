import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Avatar, Button, Confirm, Textarea } from '../../ui'
import Contact from '../../shared/Contact'
import { useLanguage } from '../../../context/language'
import { formatDate } from '../../../utils/date'
import { formatMoney } from '../../../utils/money'
import { notify } from '../../../utils/notify'
import orders from '../../../services/orders.services'
import { useResource } from '../../../hooks/useResource'

// The same rows /purchases shows, said from the other side. A seller reading
// "waiting on the seller" about their own order learns nothing; they need to be
// told it is waiting on them. Built from `t` rather than held as a module-level
// constant, because the active language is not known until render.
const statusOf = (t, status) => {
  const table = {
    pending: {
      label: t('Sales.Status.Pending.Label'),
      tone: 'bg-info text-on-info',
      note: t('Sales.Status.Pending.Note'),
    },
    confirmed: {
      label: t('Purchases.Status.Confirmed.Label'),
      tone: 'bg-good-tint text-good',
      note: t('Sales.Status.Confirmed.Note'),
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

const Sales = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const load = useCallback(() => orders.sales(), [])
  const { data, loading } = useResource(load, 'sales')

  const [list, setList] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(null)

  const rows = list ?? data ?? []

  const replace = (updated) =>
    setList(rows.map(sale => (sale.id === updated.id ? updated : sale)))

  const run = async (sale, action, message) => {
    setBusy(sale.id)
    try {
      replace(await orders[action](sale.id))
      notify(message, 'success')
    } catch {
      // Reported by the interceptor.
    } finally {
      setBusy(null)
    }
  }

  const cancel = async () => {
    setBusy(cancelling.id)
    try {
      replace(await orders.cancelSale(cancelling.id, reason))
      notify(t('Sales.Cancelled'), 'success')
      setCancelling(null)
      setReason('')
    } catch {
      // Reported by the interceptor.
    } finally {
      setBusy(null)
    }
  }

  if (loading && !list) {
    return (
      <div className="shell py-8 sm:py-10" aria-hidden>
        <div className="h-9 w-48 animate-pulse rounded-full bg-sunk" />
        <div className="panel mt-8 h-48 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="shell py-8 sm:py-10">
      <div className="max-w-prose">
        <h1 className="rule-accent font-display text-3xl font-bold tracking-tight text-ink">
          {t('Sales.Title')}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          {t('Sales.Subtitle')}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="panel mt-8 flex flex-col items-center gap-4 px-6 py-16 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">{t('Sales.Empty.Title')}</h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            {t('Sales.Empty.Body')}
          </p>
          <Button.Action as={Link} to="/listings" size="sm" className="mt-1">
            {t('Header.Account.YourListings')}
          </Button.Action>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {rows.map(sale => {
            const status = statusOf(t, sale.status)
            const working = busy === sale.id

            return (
              <li key={sale.id} className="panel p-5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  <Avatar account={sale.order?.buyer} size="sm" />

                  <div className="min-w-0 grow">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="font-display text-base font-semibold text-ink">
                        {sale.order?.buyer?.username}
                      </span>
                      <span className={clsx('rounded-pz-sm px-2 py-0.5 text-[11px] font-semibold', status.tone)}>
                        {status.label}
                      </span>
                    </div>
                    <p className="tabular mt-1 text-xs text-faint">
                      {t('Purchases.OrderNumber', { id: sale.orderId })}
                      {sale.shop && <> · {t('Sales.SoldAs', { shop: sale.shop.name })}</>}
                      {sale.order?.createdAt && <> · {formatDate(sale.order.createdAt, language)}</>}
                    </p>
                  </div>

                  <p className="tabular font-display text-lg font-semibold text-ink">
                    {formatMoney(sale.subtotal, sale.order?.currency)}
                  </p>
                </div>

                <ul className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4">
                  {sale.items?.map(item => (
                    <li key={item.id} className="tabular flex justify-between gap-4 text-sm">
                      <span className="min-w-0 text-ink">
                        {item.quantity > 1 && <span className="text-muted">{item.quantity} × </span>}
                        {item.title}
                      </span>
                      <span className="shrink-0 text-muted">
                        {formatMoney(Number(item.unitPrice) * item.quantity, sale.order?.currency)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Only present once you confirmed it: until then the server
                    does not send it. The same rule that guards yours guards
                    theirs. */}
                <Contact
                  who="buyer"
                  email={sale.order?.buyer?.email}
                  phone={sale.order?.buyer?.phone}
                />

                {sale.status === 'cancelled' && (
                  <p className="mt-4 rounded-pz-sm border-l-[3px] border-line-strong bg-sunk px-4 py-3 text-sm leading-relaxed text-muted">
                    {t('Purchases.CancelledByText', {
                      who: t(sale.cancelledBy === 'seller' ? 'Purchases.CancelledBy.You' : 'Sales.CancelledBy.Buyer'),
                    })}
                    {sale.cancelReason && <span className="text-ink"> {sale.cancelReason}</span>}
                  </p>
                )}

                {status.note && (
                  <p className="mt-3 text-sm leading-relaxed text-muted">{status.note}</p>
                )}

                {(sale.status === 'pending' || sale.status === 'confirmed') && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                    {sale.status === 'pending' && (
                      <Button.Action size="sm" loading={working}
                        onClick={() => run(sale, 'confirm', t('Sales.ConfirmedNotify'))}>
                        {t('Sales.Confirm')}
                      </Button.Action>
                    )}

                    {sale.status === 'confirmed' && (
                      <Button.Action size="sm" color="success" loading={working}
                        onClick={() => run(sale, 'deliver', t('Sales.DeliveredNotify'))}>
                        {t('Sales.MarkDelivered')}
                      </Button.Action>
                    )}

                    <Button.Action
                      variant="ghost" color="danger" size="sm" disabled={working}
                      onClick={() => setCancelling(sale)}
                    >
                      {t('Purchases.CancelAction')}
                    </Button.Action>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Confirm
        open={Boolean(cancelling)}
        title={t('Sales.ConfirmCancel.Title')}
        body={t('Sales.ConfirmCancel.Body')}
        confirmLabel={t('Sales.ConfirmCancel.Label')}
        loading={busy === cancelling?.id}
        onConfirm={cancel}
        onCancel={() => { setCancelling(null); setReason('') }}
      >
        <Textarea
          label={t('Purchases.Reason.Label')} optional rows={3}
          placeholder={t('Sales.Reason.Placeholder')}
          value={reason}
          onChange={event => setReason(event.target.value)}
        />
      </Confirm>
    </div>
  )
}

export default Sales
