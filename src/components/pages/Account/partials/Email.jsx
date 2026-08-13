import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
      notify('Your email address was changed.', 'success')
    } catch {
      // Reported by the interceptor.
    }
  }

  return (
    <section className="card p-6">
      <h2 className="text-lg font-medium">Email</h2>
      <p className="mt-0.5 text-sm text-plaza-muted">
        Currently <span className="text-plaza-ink">{me.email}</span>
        {!me.verified && ' — not confirmed yet'}
      </p>

      {pending ? (
        <form onSubmit={confirm.handleSubmit(apply)} className="mt-5 flex flex-col gap-4">
          <p className="text-sm text-plaza-ink">
            We sent a code to <strong>{pending}</strong>. Enter it to finish the change.
            Your current address keeps working until you do.
          </p>

          <Input
            label="Code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            error={confirm.formState.errors.code?.message}
            {...confirm.register('code', {
              required: 'Enter the code we sent.',
              pattern: { value: /^\d{6}$/, message: 'The code is six digits.' },
            })}
          />

          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={confirm.formState.isSubmitting}>
              Confirm change
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPending(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={request.handleSubmit(ask)} className="mt-5 flex flex-col gap-4">
          <Input
            label="New email"
            type="email"
            autoComplete="email"
            error={request.formState.errors.email?.message}
            {...request.register('email', { required: 'Enter the address you want to move to.' })}
          />

          <Input
            label="Your password"
            type="password"
            autoComplete="current-password"
            hint="Asked for because this address can reset your password."
            error={request.formState.errors.password?.message}
            {...request.register('password', { required: 'Your password is required.' })}
          />

          <div>
            <Button type="submit" size="sm" loading={request.formState.isSubmitting}>
              Send code
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}

export default Email
