import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '../../../ui'
import { notify } from '../../../../utils/notify'
import account from '../../../../services/account.services'

/**
 * Changing the address is a two-step move.
 *
 * The form asks for the password because whoever holds the email can reset the
 * password, which makes this the most valuable thing on the account to take
 * over. The code goes to the new address, so the account only moves once that
 * mailbox is proven reachable.
 */
const Email = ({ me, onChange }) => {
  const { t } = useTranslation()
  const [pending, setPending] = useState(null)

  const request = useForm({ defaultValues: { email: '', password: '' } })
  const confirm = useForm({ defaultValues: { code: '' } })

  const ask = async ({ email, password }) => {
    try {
      await account.requestEmailChange({ email, password })
      setPending(email)
      request.reset({ email: '', password: '' })
    } catch {
      // Reported by the interceptor.
    }
  }

  const apply = async ({ code }) => {
    try {
      onChange(await account.confirmEmailChange({ code }))
      setPending(null)
      confirm.reset()
      notify(t('Email.Changed'), 'success')
    } catch {
      // Reported by the interceptor.
    }
  }

  return (
    <section className="panel p-6 sm:p-7">
      <h2 className="font-display text-lg font-semibold text-ink">{t('Access.Email.Label')}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {t('Email.Currently')} <span className="font-medium text-ink">{me.email}</span>
        {!me.verified && (
          <span className="ml-2 inline-block rounded-pz-sm bg-info px-1.5 py-0.5 align-middle text-[11px] font-semibold text-on-info">
            {t('Email.NotConfirmed')}
          </span>
        )}
      </p>

      {pending ? (
        <form onSubmit={confirm.handleSubmit(apply)} className="mt-5 flex flex-col gap-4">
          <p className="text-sm text-ink">
            {t('Email.CodeSentTo', { email: pending })}
          </p>

          <Input
            label={t('Account.Code.Label')}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            error={confirm.formState.errors.code?.message}
            {...confirm.register('code', {
              required: t('Account.Code.Required'),
              pattern: { value: /^\d{6}$/, message: t('Account.Code.Pattern') },
            })}
          />

          <div className="flex gap-2">
            <Button.Action type="submit" size="sm" loading={confirm.formState.isSubmitting}>
              {t('Email.ConfirmChange')}
            </Button.Action>
            <Button.Action variant="ghost" size="sm" onClick={() => setPending(null)}>
              {t('Shared.Confirm.Cancel')}
            </Button.Action>
          </div>
        </form>
      ) : (
        <form onSubmit={request.handleSubmit(ask)} className="mt-5 flex flex-col gap-4">
          <Input
            label={t('Email.NewEmail.Label')}
            type="email"
            autoComplete="email"
            error={request.formState.errors.email?.message}
            {...request.register('email', { required: t('Email.NewEmail.Required') })}
          />

          <Input
            label={t('Email.YourPassword.Label')}
            type="password"
            autoComplete="current-password"
            hint={t('Email.YourPassword.Hint')}
            error={request.formState.errors.password?.message}
            {...request.register('password', { required: t('Access.Password.Required') })}
          />

          <div>
            <Button.Action type="submit" size="sm" loading={request.formState.isSubmitting}>
              {t('Email.SendCode')}
            </Button.Action>
          </div>
        </form>
      )}
    </section>
  )
}

export default Email
