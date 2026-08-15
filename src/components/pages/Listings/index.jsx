import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
// listing or what to do about it. Built from `t` rather than held as a
// module-level constant, because the active language is not known until
// render.
const statusOf = (t, status) => {
  const table = {
    draft: {
      label: t('Listings.Status.Draft.Label'),
      tone: 'bg-sunk text-muted',
      note: t('Listings.Status.Draft.Note'),
    },
    active: {
      label: t('Listings.Status.Published.Label'),
      tone: 'bg-good-tint text-good',
      note: null,
    },
    paused: {
      label: t('Listings.Status.Paused.Label'),
      tone: 'bg-sunk text-muted',
      note: t('Listings.Status.Paused.Note'),
    },
    out_of_stock: {
      label: t('Listings.Status.OutOfStock.Label'),
      tone: 'bg-info-tint text-ink',
      note: t('Listings.Status.OutOfStock.Note'),
    },
    archived: {
      label: t('Listings.Status.Archived.Label'),
      tone: 'bg-sunk text-muted',
      note: t('Listings.Status.Archived.Note'),
    },
  }

  return table[status] ?? { label: status, tone: 'bg-sunk text-muted', note: null }
}

const Listings = () => {
  const { t } = useTranslation()
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
      notify(t('Listings.Deleted', { title: deleting.title }), 'success')
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
          onClick={() => run(product, 'archive', p => t('Listings.Archived', { title: p.title }))}>
          {t('Listings.Archive')}
        </Button.Action>
      )
    }

    return (
      <Button.Action size="sm" loading={working}
        onClick={() => run(product, 'publish', p => t('Listings.Published', { title: p.title }))}>
        {t('Listings.Publish')}
      </Button.Action>
    )
  }

  return (
    <div className="shell py-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="max-w-prose">
          <h1 className="rule-accent font-display text-3xl font-bold tracking-tight text-ink">
            {t('Listings.Title')}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            {t('Listings.Intro')}
          </p>
        </div>
        <Button.Action as={Link} to="/listings/new" size="sm">{t('Sell.Get.ListItem')}</Button.Action>
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
            <h2 className="font-display text-xl font-semibold text-ink">{t('Listings.Empty.Title')}</h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              {t('Listings.Empty.Body')}
            </p>
            <Button.Action as={Link} to="/listings/new" size="sm" className="mt-1">{t('Sell.Get.ListItem')}</Button.Action>
          </div>
        ) : (
          <ul className="panel divide-y divide-line">
            {rows.map(product => {
              const status = statusOf(t, product.status)
              const cover = product.images?.[0]?.url

              return (
                <li key={product.id} className="p-4 flex flex-col gap-4">
                  <div className="flex flex-wrap gap-x-4 gap-y-3">
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        className="size-16 shrink-0 rounded-sm object-cover"
                      />
                    ) : (
                      // The missing photo is the most common reason publishing
                      // is refused, so the row says so before the seller tries.
                      <span className="flex size-16 shrink-0 items-center justify-center rounded-pz bg-sunk text-faint">
                        <PhotoIcon className="size-6" />
                      </span>
                    )}

                    <div className="flex flex-col min-w-0 grow">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <Link
                          to={`/listings/${product.id}`}
                          className="font-display text-base font-semibold text-ink hover:underline"
                        >
                          {product.title}
                        </Link>
                        <span className={clsx('rounded-pz-sm px-2 text-[11px] font-semibold', status.tone)}>
                          {status.label}
                        </span>
                      </div>
                      <p className="tabular text-sm text-muted">
                        {formatMoney(product.price, product.currency)}
                        <span className="text-faint"> · {t('Listings.InStock', { count: product.stock })}</span>
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button.Action as={Link} to={`/listings/${product.id}`} variant="outline" color="neutral" size="sm">
                        {t('Listings.Edit')}
                      </Button.Action>
                      {actions(product)}
                      <Button.Action
                        variant="ghost" color="danger" size="sm"
                        onClick={() => setDeleting(product)}
                      >
                        {t('Listings.Delete')}
                      </Button.Action>
                    </div>
                  </div>

                  {status.note && (
                    <p className="text-sm leading-relaxed text-muted">{status.note}</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Confirm
        open={Boolean(deleting)}
        title={t('Listings.DeleteConfirm.TitleNamed', { title: deleting?.title ?? t('Listings.DeleteConfirm.ThisListing') })}
        body={t('Listings.DeleteConfirm.Body')}
        confirmLabel={t('Listings.DeleteConfirm.Label')}
        loading={busy === deleting?.id}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

export default Listings
