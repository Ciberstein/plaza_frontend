import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
        <p className="text-sm text-ink">Your email is confirmed.</p>
      </section>
    )
  }

  const submit = async ({ code }) => {
    try {
      await account.verify(code)
      onChange({ ...me, verified: true })
      reset()
      notify('Email confirmed. You can list things for sale now.', 'success')
    } catch {
      // Reported by the interceptor.
    }
  }

  const resend = async () => {
    setSending(true)
    try {
      await account.resendVerification()
      notify('We sent another code.', 'success')
    } catch {
      // Including the cooldown, which comes back as a plain message.
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="rounded-pz border border-line border-l-[3px] border-l-info bg-surface p-6 sm:p-7">
      <h2 className="font-display text-lg font-semibold text-ink">Confirm your email</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        We sent a code to <span className="font-medium text-ink">{me.email}</span>. You can
        browse and buy without confirming. Confirming is what lets you sell.
      </p>

      <form onSubmit={handleSubmit(submit)} className="mt-5 flex flex-col gap-4 sm:max-w-xs">
        <Input
          label="Code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          error={errors.code?.message}
          {...register('code', {
            required: 'Enter the code we sent.',
            pattern: { value: /^\d{6}$/, message: 'The code is six digits.' },
          })}
        />

        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={isSubmitting}>
            Confirm
          </Button>
          <Button variant="ghost" size="sm" loading={sending} onClick={resend}>
            Send another
          </Button>
        </div>
      </form>
    </section>
  )
}

export default Verify
