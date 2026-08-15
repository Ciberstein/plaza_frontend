import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useTranslation } from 'react-i18next'
import * as Button from './Button'

/**
 * A question before something irreversible.
 *
 * The confirming button says what will happen — "Delete listing", not "OK" —
 * because the one place a person reads carefully is the button they are about
 * to press, and "OK" tells them nothing about what they are agreeing to.
 *
 * Cancel is the quiet one and Escape does the same thing. The dangerous action
 * never gets to be the easiest thing on screen to hit by accident.
 */
const Confirm = ({
  open,
  title,
  body,
  confirmLabel,
  confirmColor = 'danger',
  loading = false,
  onConfirm,
  onCancel,
  children,
}) => {
  const { t } = useTranslation()

  return (
  <Dialog open={open} onClose={loading ? () => {} : onCancel} className="relative z-100">
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]" aria-hidden />

    <div className="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel
        transition
        className="w-full max-w-sm rounded-pz border border-line bg-surface p-6 shadow-[0_24px_60px_-15px_hsl(var(--pz-shadow)/0.45)] duration-150 ease-pz data-closed:scale-95 data-closed:opacity-0"
      >
        <DialogTitle className="font-display text-lg font-semibold text-ink">
          {title}
        </DialogTitle>

        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>

        {/* Somewhere for the caller to ask one more thing before the deed:
            a reason, a confirmation phrase. Absent by default. */}
        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button.Action variant="ghost" onClick={onCancel} disabled={loading}>
            {t('Shared.Confirm.Cancel')}
          </Button.Action>
          <Button.Action color={confirmColor} onClick={onConfirm} loading={loading}>
            {confirmLabel ?? t('Shared.Confirm.DefaultConfirm')}
          </Button.Action>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
  )
}

export default Confirm
