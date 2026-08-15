import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Button, Input, Textarea } from '../ui'
import { notify } from '../../utils/notify'
import visits, { MESSAGE_MAX } from '../../services/visits.services'

/**
 * Asking to see a property.
 *
 * This is what a property has instead of "add to basket", and the dialog says
 * so in as many words: the owner decides, and accepting is what hands each
 * side the other's details. Somebody writing to a stranger about their home
 * should know before they type what is about to be shared and when.
 *
 * The suggested day is optional and framed as a suggestion. It reserves
 * nothing — there is no calendar behind it — and calling it a booking would be
 * a promise the system cannot keep.
 */
const VisitRequest = ({ product, onSent }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [when, setWhen] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  // Today, as the earliest day worth offering. The server refuses a date in
  // the past; this stops the person reaching that refusal by using the
  // calendar the way calendars work.
  const today = new Date().toISOString().slice(0, 10)

  const send = async () => {
    const body = message.trim()

    if (!body) return setError(t('Visit.Modal.MessageRequired'))

    setBusy(true)
    setError(null)

    try {
      const visit = await visits.request(product.id, body, when || null)
      notify(t('Visit.Sent'), 'success')
      setOpen(false)
      setMessage('')
      setWhen('')
      onSent?.(visit)
    } catch {
      // Said by the interceptor. The dialog stays open with what was typed
      // still in it, because retyping a paragraph is the worst possible answer
      // to a request that failed for a reason nobody chose.
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button.Action type="button" size="lg" className="w-full" onClick={() => setOpen(true)}>
        {t('Visit.Ask')}
      </Button.Action>

      <Dialog open={open} onClose={busy ? () => {} : () => setOpen(false)} className="relative z-100">
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]" aria-hidden />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            transition
            className="flex w-full max-w-lg flex-col gap-4 rounded-pz border border-line bg-surface p-6 shadow-[0_24px_60px_-15px_hsl(var(--pz-shadow)/0.45)] duration-150 ease-pz data-closed:scale-95 data-closed:opacity-0"
          >
            <DialogTitle className="font-display text-lg font-semibold text-ink">
              {t('Visit.Modal.Title', { title: product.title })}
            </DialogTitle>

            <p className="text-sm leading-relaxed text-muted">{t('Visit.Modal.Body')}</p>

            <Textarea
              label={t('Visit.Modal.Message')}
              placeholder={t('Visit.Modal.MessagePlaceholder')}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                if (error) setError(null)
              }}
              maxLength={MESSAGE_MAX}
              rows={4}
              error={error}
            />

            <Input
              type="date"
              label={t('Visit.Modal.When')}
              hint={t('Visit.Modal.WhenHint')}
              min={today}
              value={when}
              onChange={e => setWhen(e.target.value)}
            />

            <div className="mt-1 flex flex-wrap justify-end gap-3">
              <Button.Action
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                {t('Shared.Confirm.Cancel')}
              </Button.Action>
              <Button.Action type="button" onClick={send} loading={busy}>
                {t('Visit.Modal.Send')}
              </Button.Action>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}

export default VisitRequest
