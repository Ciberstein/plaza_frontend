import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button, ShopLogo } from '../../ui'
import { useLanguage } from '../../../context/language'
import { notify } from '../../../utils/notify'
import members from '../../../services/members.services'
import { useResource } from '../../../hooks/useResource'

/**
 * Shops asking you to join them.
 *
 * A page of its own rather than a panel inside the shops screen, because until
 * you accept one, the shop is not yours to look inside. "What am I being asked
 * to join" cannot be a question about a shop you cannot yet read.
 *
 * What accepting grants is spelled out before the buttons. Somebody clicking
 * accept is handing a stranger's catalogue their name and taking on their
 * buyers, and that is worth one sentence more than a yes/no.
 */
const Invitations = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()

  const load = useCallback(() => members.invitations(), [])
  const { data, loading } = useResource(load, 'invitations')

  const [list, setList] = useState(null)
  const [busy, setBusy] = useState(null)

  const rows = list ?? data ?? []

  const day = (value) =>
    value ? new Date(value).toLocaleDateString(language, { day: 'numeric', month: 'long' }) : null

  const answer = async (invitation, accept) => {
    setBusy(invitation.id)
    try {
      if (accept) await members.accept(invitation.id)
      else await members.decline(invitation.id)

      setList(rows.filter(row => row.id !== invitation.id))
      notify(
        accept
          ? t('Invitations.Accepted', { shop: invitation.shop?.name })
          : t('Invitations.Declined'),
        'success',
      )
    } catch {
      // Reported by the interceptor, and the row stays put.
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="shell py-8 sm:py-10">
      <div className="max-w-prose">
        <h1 className="rule-accent font-display text-3xl font-bold tracking-tight text-ink">
          {t('Invitations.Title')}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">{t('Invitations.Body')}</p>
      </div>

      <div className="mt-8">
        {loading && !list ? (
          <div className="panel divide-y divide-line" aria-hidden>
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="size-12 animate-pulse rounded-pz bg-sunk" />
                <div className="h-4 w-48 animate-pulse rounded-full bg-sunk" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="panel flex flex-col items-center gap-4 px-6 py-16 text-center">
            <h2 className="font-display text-xl font-semibold text-ink">
              {t('Invitations.Title')}
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              {t('Members.Empty')}
            </p>
            <Button.Action as={Link} to="/dashboard" size="sm" className="mt-1">
              {t('Common.BackToPlaza')}
            </Button.Action>
          </div>
        ) : (
          <ul className="panel divide-y divide-line">
            {rows.map(invitation => (
              <li key={invitation.id} className="flex flex-wrap items-center gap-4 p-4">
                <ShopLogo shop={invitation.shop} size="sm" />

                <div className="flex min-w-0 grow flex-col">
                  <span className="font-display text-base font-semibold text-ink">
                    {invitation.shop?.name}
                  </span>
                  <span className="text-xs text-faint">
                    {invitation.invitedBy
                      ? t('Invitations.From', { name: invitation.invitedBy })
                      : day(invitation.invitedAt)}
                  </span>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button.Action
                    size="sm"
                    loading={busy === invitation.id}
                    onClick={() => answer(invitation, true)}
                  >
                    {t('Invitations.Accept')}
                  </Button.Action>
                  <Button.Action
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    disabled={busy === invitation.id}
                    onClick={() => answer(invitation, false)}
                  >
                    {t('Invitations.Decline')}
                  </Button.Action>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Invitations
