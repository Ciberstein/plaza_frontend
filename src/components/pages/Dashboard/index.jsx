import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { UsersIcon } from '@heroicons/react/20/solid'
import { Button, ShopLogo } from '../../ui'
import ShopMembers from '../../shared/ShopMembers'
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
//
// Built from `t` rather than held as a module-level constant, because the
// active language is not known until render.
const statusOf = (t, status) => {
  const table = {
    draft: {
      label: t('Dashboard.Status.Draft.Label'),
      tone: 'bg-sunk text-muted',
      note: t('Dashboard.Status.Draft.Note'),
    },
    pending: {
      label: t('Dashboard.Status.Pending.Label'),
      tone: 'bg-info text-on-info',
      note: t('Dashboard.Status.Pending.Note'),
    },
    rejected: {
      label: t('Dashboard.Status.Rejected.Label'),
      tone: 'bg-alert-tint text-alert',
      note: null,
    },
    active: {
      label: t('Dashboard.Status.Active.Label'),
      tone: 'bg-good-tint text-good',
      note: null,
    },
    suspended: {
      label: t('Dashboard.Status.Suspended.Label'),
      tone: 'bg-alert-tint text-alert',
      note: t('Dashboard.Status.Suspended.Note'),
    },
    closed: {
      label: t('Dashboard.Status.Closed.Label'),
      tone: 'bg-sunk text-muted',
      note: t('Dashboard.Status.Closed.Note'),
    },
  }

  return table[status] ?? { label: status, tone: 'bg-sunk text-muted', note: null }
}

const Dashboard = () => {
  const { t } = useTranslation()
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

  // Which roster is open, one at a time — a screen of five shops each with
  // their own expanded team is a screen nobody can read.
  const [team, setTeam] = useState(null)

  // Going live is absent on purpose: it is not one of the seller's transitions.
  const actions = (shop) => {
    const working = busy === shop.id

    switch (shop.status) {
      case 'draft':
      case 'rejected':
        return (
          <Button.Action size="sm" loading={working}
            onClick={() => run(shop, 'submit', s => t('Dashboard.SentForReview', { name: s.name }))}>
            {t('Dashboard.SendForReview')}
          </Button.Action>
        )
      case 'pending':
        return (
          <Button.Action variant="outline" color="neutral" size="sm" loading={working}
            onClick={() => run(shop, 'withdraw', s => t('Dashboard.Withdrawn', { name: s.name }))}>
            {t('Dashboard.Withdraw')}
          </Button.Action>
        )
      case 'active':
        return (
          <>
            <Button.Action variant="outline" color="neutral" size="sm" as={Link} to={`/s/${shop.slug}`}>
              {t('Dashboard.ViewStorefront')}
            </Button.Action>
            <Button.Action variant="ghost" size="sm" loading={working}
              onClick={() => run(shop, 'close', s => t('Dashboard.Closed', { name: s.name }))}>
              {t('Dashboard.Close')}
            </Button.Action>
          </>
        )
      case 'closed':
        return (
          <Button.Action size="sm" loading={working}
            onClick={() => run(shop, 'reopen', s => t('Dashboard.Reopened', { name: s.name }))}>
            {t('Dashboard.OpenAgain')}
          </Button.Action>
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
            {t('Dashboard.Title')}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            {t('Dashboard.Intro')}
          </p>
        </div>
        <Button.Action as={Link} to="/sell/shop" size="sm">{t('Header.Account.RequestShop')}</Button.Action>
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
            <h2 className="font-display text-xl font-semibold text-ink">{t('Dashboard.Empty.Title')}</h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              {t('Dashboard.Empty.Body')}
            </p>
            <Button.Action as={Link} to="/sell/shop" size="sm" className="mt-1">{t('Header.Account.RequestShop')}</Button.Action>
          </div>
        ) : (
          // One panel with rules between the rows, rather than a stack of
          // separate cards. Six shadowed boxes in a column read as six unrelated
          // things; a divided list reads as one list, which is what it is.
          <ul className="panel divide-y divide-line">
            {list.map(shop => {
              const status = statusOf(t, shop.status)

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

                    <div className="flex shrink-0 gap-2">
                      {/* A collaborator sees this too, on a shop that is not
                          theirs to close or reopen — the roster is read-only
                          for them, and that is enforced by the panel itself,
                          not by hiding the button. */}
                      {shop.status !== 'draft' && (
                        <Button.Action
                          variant="outline" color="neutral" size="sm"
                          onClick={() => setTeam(t => (t === shop.id ? null : shop.id))}
                        >
                          <UsersIcon className="size-4" />
                          {t('Members.Title')}
                        </Button.Action>
                      )}
                      {shop.mine !== false && actions(shop)}
                    </div>
                  </div>

                  {team === shop.id && (
                    <div className="mt-4 border-t border-line pt-4">
                      <ShopMembers shop={shop} />
                    </div>
                  )}

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
