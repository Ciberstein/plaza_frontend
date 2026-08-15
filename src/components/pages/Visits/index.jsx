import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { Button, Confirm } from '../../ui'
import { useLanguage } from '../../../context/language'
import { notify } from '../../../utils/notify'
import visits from '../../../services/visits.services'
import { useResource } from '../../../hooks/useResource'

// What each state means, and how loudly. Waiting is the one with something to
// do, so it is the one that carries colour; the other two are records.
const TONE = {
  pending: 'bg-info-tint text-ink',
  accepted: 'bg-good-tint text-good',
  declined: 'bg-sunk text-muted',
}

const STATUS_KEY = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
}

/**
 * The contact block, which is the whole point of the feature.
 *
 * Present in both states rather than appearing out of nowhere on acceptance:
 * before, it says what is behind it and what opens it. A panel that materialises
 * only once something has happened leaves the person before that wondering
 * whether there is anything there at all.
 *
 * Nothing is hidden here by choice — the server sends nulls until the owner
 * accepts, so there is nothing in the payload to reveal.
 */
const Contact = ({ visit }) => {
  const { t } = useTranslation()
  const open = visit.status === 'accepted'
  const { party, product } = visit

  if (!open) {
    return (
      <p className="rounded-pz border border-line bg-sunk px-3 py-2.5 text-xs leading-relaxed text-muted">
        {t('Visits.Contact.Locked')}
      </p>
    )
  }

  return (
    <div className="rounded-pz border border-line bg-sunk px-3 py-2.5">
      <p className="text-xs font-semibold text-ink">{t('Visits.Contact.Title')}</p>

      <ul className="mt-2 flex flex-col gap-1.5">
        {party.email && (
          <li className="flex items-center gap-2 text-sm text-ink">
            <EnvelopeIcon className="size-4 shrink-0 text-muted" />
            <a href={`mailto:${party.email}`} className="truncate text-link hover:underline">
              {party.email}
            </a>
          </li>
        )}

        <li className="flex items-center gap-2 text-sm text-ink">
          <PhoneIcon className="size-4 shrink-0 text-muted" />
          {party.phone ? (
            <a href={`tel:${party.phone}`} className="tabular text-link hover:underline">
              {party.phone}
            </a>
          ) : (
            <span className="text-faint">{t('Visits.Contact.NoPhone')}</span>
          )}
        </li>

        {product?.address && (
          <li className="flex items-start gap-2 text-sm text-ink">
            <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted" />
            {product.address}
          </li>
        )}
      </ul>
    </div>
  )
}

/** One request, from whichever side is reading it. */
const Row = ({ visit, as, onAccept, onDecline, busy }) => {
  const { t } = useTranslation()
  const { language } = useLanguage()

  const day = (value) =>
    value ? new Date(value).toLocaleDateString(language, { day: 'numeric', month: 'long' }) : null

  const where = [visit.product?.neighborhood, visit.product?.city].filter(Boolean).join(', ')

  return (
    <li className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap gap-x-4 gap-y-3">
        {visit.product?.cover ? (
          <img src={visit.product.cover} alt="" className="size-16 shrink-0 rounded-sm object-cover" />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-pz bg-sunk text-faint">
            <PhotoIcon className="size-6" />
          </span>
        )}

        <div className="flex min-w-0 grow flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <Link
              to={`/p/${visit.productId}`}
              className="font-display text-base font-semibold text-ink hover:underline"
            >
              {visit.product?.title}
            </Link>
            <span className={clsx('rounded-pz-sm px-2 text-[11px] font-semibold', TONE[visit.status])}>
              {t(`Visits.Status.${STATUS_KEY[visit.status]}`)}
            </span>
          </div>

          <p className="text-sm text-muted">{where}</p>

          {/* Who is on the other end. The owner is told who asked, because
              they are being asked to let a stranger into a building; the
              visitor is told whose it is. */}
          {visit.party?.username && (
            <p className="text-sm text-ink">{visit.party.username}</p>
          )}
        </div>

        {as === 'owner' && visit.status === 'pending' && (
          <div className="flex shrink-0 flex-wrap items-start gap-2">
            <Button.Action size="sm" loading={busy} onClick={onAccept}>
              {t('Visits.Accept')}
            </Button.Action>
            <Button.Action variant="ghost" color="neutral" size="sm" disabled={busy} onClick={onDecline}>
              {t('Visits.Decline')}
            </Button.Action>
          </div>
        )}
      </div>

      <p className="rounded-pz border border-line border-l-[3px] border-l-line-strong bg-sunk px-3 py-2.5 text-sm leading-relaxed whitespace-pre-line text-ink">
        {visit.message}
      </p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-faint">
        <span>{t('Visits.Asked', { date: day(visit.createdAt) })}</span>
        {visit.preferredAt && <span>{t('Visits.Prefers', { date: day(visit.preferredAt) })}</span>}
      </div>

      <Contact visit={visit} />
    </li>
  )
}

const Skeleton = () => (
  <div className="panel divide-y divide-line" aria-hidden>
    {Array.from({ length: 2 }, (_, i) => (
      <div key={i} className="flex items-center gap-4 p-4">
        <div className="size-16 animate-pulse rounded-pz bg-sunk" />
        <div className="flex grow flex-col gap-2">
          <div className="h-4 w-56 animate-pulse rounded-full bg-sunk" />
          <div className="h-2.5 w-24 animate-pulse rounded-full bg-sunk" />
        </div>
      </div>
    ))}
  </div>
)

/**
 * Both sides of asking to see a property.
 *
 * Two tabs rather than one list. Somebody who rents out a flat and is also
 * looking for one has two entirely different jobs here — answering, and
 * waiting — and a single feed mixing them makes the one with something to do
 * harder to find.
 */
const Visits = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState('received')
  const [rows, setRows] = useState(null)
  const [busy, setBusy] = useState(null)
  const [declining, setDeclining] = useState(null)

  const load = useCallback(
    () => (tab === 'received' ? visits.received() : visits.mine()),
    [tab],
  )
  const { data, loading } = useResource(load, tab)

  // The server's answer until something is answered here, then whatever this
  // screen has since made true. Reset by the key changing when the tab does.
  const list = rows?.tab === tab ? rows.list : data ?? []

  const replace = (updated) =>
    setRows({ tab, list: list.map(v => (v.id === updated.id ? updated : v)) })

  const answer = async (visit, action) => {
    setBusy(visit.id)
    try {
      const updated = await visits[action](visit.id)
      replace(updated)
      notify(t(action === 'accept' ? 'Visits.Accepted' : 'Visits.Declined'), 'success')
      setDeclining(null)
    } catch {
      // Reported by the interceptor, and the row stays as it was.
    } finally {
      setBusy(null)
    }
  }

  const tabButton = (value, label) => (
    <button
      type="button"
      onClick={() => { setTab(value); setRows(null) }}
      className={clsx(
        'cursor-pointer border-b-2 px-1 pb-2.5 text-sm font-medium transition-colors',
        tab === value
          ? 'border-accent text-ink'
          : 'border-transparent text-muted hover:text-ink',
      )}
    >
      {label}
    </button>
  )

  const mine = tab === 'mine'

  return (
    <div className="shell py-8 sm:py-10">
      <div className="max-w-prose">
        <h1 className="rule-accent font-display text-3xl font-bold tracking-tight text-ink">
          {t('Visits.Title')}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">{t('Visits.Intro')}</p>
      </div>

      <div className="mt-8 flex gap-6 border-b border-line">
        {tabButton('received', t('Visits.Tab.Received'))}
        {tabButton('mine', t('Visits.Tab.Mine'))}
      </div>

      <div className="mt-6">
        {loading && !rows ? (
          <Skeleton />
        ) : list.length === 0 ? (
          <div className="panel flex flex-col items-center gap-4 px-6 py-16 text-center">
            <h2 className="font-display text-xl font-semibold text-ink">
              {t(mine ? 'Visits.Empty.Mine.Title' : 'Visits.Empty.Received.Title')}
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              {t(mine ? 'Visits.Empty.Mine.Body' : 'Visits.Empty.Received.Body')}
            </p>
            {mine && (
              <Button.Action as={Link} to="/properties" size="sm" className="mt-1">
                {t('Properties.Title')}
              </Button.Action>
            )}
          </div>
        ) : (
          <ul className="panel divide-y divide-line">
            {list.map(visit => (
              <Row
                key={visit.id}
                visit={visit}
                as={mine ? 'visitor' : 'owner'}
                busy={busy === visit.id}
                onAccept={() => answer(visit, 'accept')}
                onDecline={() => setDeclining(visit)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Asked about, because it cannot be taken back: the same person cannot
          ask about the same property twice, so declining closes the door for
          good. */}
      <Confirm
        open={Boolean(declining)}
        title={t('Visits.DeclineConfirm.Title')}
        body={t('Visits.DeclineConfirm.Body')}
        confirmLabel={t('Visits.DeclineConfirm.Label')}
        loading={busy === declining?.id}
        onConfirm={() => answer(declining, 'decline')}
        onCancel={() => setDeclining(null)}
      />
    </div>
  )
}

export default Visits
