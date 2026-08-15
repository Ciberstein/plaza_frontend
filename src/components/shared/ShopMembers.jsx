import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlusIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { Avatar, Button, Confirm, Input } from '../ui'
import { useAuth } from '../../context/auth'
import { useLanguage } from '../../context/language'
import { notify } from '../../utils/notify'
import members from '../../services/members.services'
import { useResource } from '../../hooks/useResource'

/**
 * Who works in a shop.
 *
 * The owner is not a row in the members table — they are the shop's
 * `accountId` — but to somebody reading this there is one list, so the two are
 * assembled into one here. A roster that showed "the owner" somewhere else on
 * the page would be describing the schema rather than the shop.
 *
 * Pending invitations sit in the same list, greyed and labelled. Keeping them
 * apart would hide the most useful fact on the screen: that you invited
 * somebody last week and they never answered.
 */
const Seat = ({ person, canRemove, onRemove, busy, me }) => {
  const { t } = useTranslation()
  const { language } = useLanguage()

  const day = (value) =>
    value ? new Date(value).toLocaleDateString(language, { day: 'numeric', month: 'long' }) : null

  const mine = person.accountId === me

  return (
    <li className={clsx('flex flex-wrap items-center gap-3 p-4', person.pending && 'opacity-70')}>
      <Avatar account={{ username: person.username, avatar: person.avatar }} size="sm" />

      <div className="flex min-w-0 grow flex-col">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate font-medium text-ink">{person.username}</span>

          {person.owner && (
            <span className="rounded-pz-sm bg-accent-tint px-2 text-[11px] font-semibold text-link">
              {t('Members.Owner')}
            </span>
          )}
          {mine && (
            <span className="rounded-pz-sm bg-sunk px-2 text-[11px] font-semibold text-muted">
              {t('Members.You')}
            </span>
          )}
          {person.pending && (
            <span className="rounded-pz-sm bg-info-tint px-2 text-[11px] font-semibold text-ink">
              {t('Members.Pending')}
            </span>
          )}
        </span>

        <span className="text-xs text-faint">
          {person.owner
            ? null
            : person.pending
              ? t('Members.InvitedOn', { date: day(person.invitedAt) })
              : t('Members.Since', { date: day(person.acceptedAt) })}
        </span>
      </div>

      {canRemove && (
        <Button.Action variant="ghost" color="danger" size="sm" disabled={busy} onClick={onRemove}>
          {mine
            ? t('Members.Leave')
            : person.pending ? t('Members.CancelInvite') : t('Members.Remove')}
        </Button.Action>
      )}
    </li>
  )
}

const ShopMembers = ({ shop }) => {
  const { t } = useTranslation()
  const { account } = useAuth()

  const load = useCallback(() => members.list(shop.id), [shop.id])
  const { data, loading } = useResource(load, String(shop.id))

  const [roster, setRoster] = useState(null)
  const [handle, setHandle] = useState('')
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState(null)

  const current = roster ?? data
  const owned = current?.owned ?? false
  const seats = current?.members ?? []

  const invite = async (event) => {
    event.preventDefault()
    const typed = handle.trim()
    if (!typed) return

    setBusy(true)
    try {
      const seat = await members.invite(shop.id, typed)
      setRoster({ ...current, members: [...seats, seat] })
      setHandle('')
      notify(t('Members.Invite.Sent', { name: seat.username }), 'success')
    } catch {
      // The interceptor says which of the four refusals it was — no such
      // person, already invited, already works here, or the shop is full.
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await members.remove(shop.id, removing.accountId)
      setRoster({ ...current, members: seats.filter(s => s.accountId !== removing.accountId) })
      notify(
        removing.accountId === account?.id
          ? t('Members.Left')
          : t('Members.Removed', { name: removing.username }),
        'success',
      )
      setRemoving(null)
    } catch {
      // Reported by the interceptor; the row stays where it was.
    } finally {
      setBusy(false)
    }
  }

  if (loading && !roster) {
    return (
      <div className="panel divide-y divide-line" aria-hidden>
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <div className="size-9 animate-pulse rounded-full bg-sunk" />
            <div className="h-4 w-40 animate-pulse rounded-full bg-sunk" />
          </div>
        ))}
      </div>
    )
  }

  const everyone = [current?.owner, ...seats].filter(Boolean)
  const leaving = removing?.accountId === account?.id

  return (
    <section className="flex flex-col gap-4">
      <div className="max-w-prose">
        <h2 className="font-display text-lg font-semibold text-ink">{t('Members.Title')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {owned ? t('Members.Intro') : t('Members.IntroMember')}
        </p>
      </div>

      <ul className="panel divide-y divide-line">
        {everyone.map(person => (
          <Seat
            key={person.accountId}
            person={person}
            me={account?.id}
            busy={busy}
            // The owner may remove anybody but themselves; anybody may remove
            // themselves. Both are the same row going away, so both are the
            // same button.
            canRemove={
              !person.owner && (owned || person.accountId === account?.id)
            }
            onRemove={() => setRemoving(person)}
          />
        ))}

        {everyone.length === 1 && (
          <li className="px-4 py-6 text-center text-sm text-muted">{t('Members.Empty')}</li>
        )}
      </ul>

      {owned && (
        <form onSubmit={invite} className="flex flex-wrap items-end gap-3">
          <Input
            label={t('Members.Invite.Label')}
            hint={t('Members.Invite.Hint')}
            placeholder={t('Members.Invite.Placeholder')}
            value={handle}
            onChange={e => setHandle(e.target.value)}
            className="min-w-56 grow"
          />
          <Button.Action type="submit" loading={busy} disabled={!handle.trim()} className="mb-6">
            <UserPlusIcon className="size-4" />
            {t('Members.Invite.Send')}
          </Button.Action>
        </form>
      )}

      <Confirm
        open={Boolean(removing)}
        title={
          leaving
            ? t('Members.LeaveConfirm.Title', { shop: shop.name })
            : t('Members.RemoveConfirm.Title', { name: removing?.username })
        }
        body={leaving ? t('Members.LeaveConfirm.Body') : t('Members.RemoveConfirm.Body')}
        confirmLabel={
          leaving ? t('Members.LeaveConfirm.Label') : t('Members.RemoveConfirm.Label')
        }
        loading={busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </section>
  )
}

export default ShopMembers
