import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import { Button, Input } from '../../../ui'
import { notify } from '../../../../utils/notify'
import account from '../../../../services/account.services'

/**
 * Confirming the address the account was opened with.
 *
 * Shown only while it is unconfirmed. Buying works without this; listing
 * something does not, and the copy says so rather than nagging without a
 * reason.
 */
const Verify = ({ me, onChange }) => {
  const { t } = useTranslation()
  const [sending, setSending] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { code: '' } })

  if (me.verified) {
    return (
      <section className="flex items-center gap-3 rounded-pz border border-line bg-surface px-6 py-4">
        <CheckCircleIcon className="size-5 shrink-0 text-good" />
        <p className="text-sm text-ink">{t('Sell.Get.EmailConfirmed')}</p>
      </section>
    )
  }

  const submit = async ({ code }) => {
    try {
      await account.verify(code)
      onChange({ ...me, verified: true })
      reset()
      notify(t('Verify.ConfirmedNotify'), 'success')
    } catch {
      // Reported by the interceptor.
    }
  }

  const resend = async () => {
    setSending(true)
    try {
      await account.resendVerification()
      notify(t('Verify.ResendNotify'), 'success')
    } catch {
      // Including the cooldown, which comes back as a plain message.
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="rounded-pz border border-line border-l-[3px] border-l-info bg-surface p-6 sm:p-7">
      <h2 className="font-display text-lg font-semibold text-ink">{t('Sell.Get.ConfirmEmail')}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {t('Verify.Intro', { email: me.email })}
      </p>

      <form onSubmit={handleSubmit(submit)} className="mt-5 flex flex-col gap-4 sm:max-w-xs">
        <Input
          label={t('Account.Code.Label')}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          error={errors.code?.message}
          {...register('code', {
            required: t('Account.Code.Required'),
            pattern: { value: /^\d{6}$/, message: t('Account.Code.Pattern') },
          })}
        />

        <div className="flex gap-2">
          <Button.Action type="submit" size="sm" loading={isSubmitting}>
            {t('Verify.Confirm')}
          </Button.Action>
          <Button.Action variant="ghost" size="sm" loading={sending} onClick={resend}>
            {t('Verify.SendAnother')}
          </Button.Action>
        </div>
      </form>
    </section>
  )
}

export default Verify
