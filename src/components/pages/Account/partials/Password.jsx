import { useForm } from 'react-hook-form'
import { Button, Input } from '../../../ui'
import { notify } from '../../../../utils/notify'
import account from '../../../../services/account.services'

const Password = () => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { current: '', password: '', repeat: '' } })

  const save = async ({ current, password }) => {
    try {
      await account.updatePassword({ current, password })
      reset()
      notify('Password updated.', 'success')
    } catch {
      // The server does the real judging — length, reuse, common passwords —
      // and the interceptor shows whatever it said.
    }
  }

  return (
    <section className="panel p-6 sm:p-7">
      <h2 className="font-display text-lg font-semibold text-ink">Password</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        A phrase you will remember beats a short password full of symbols.
      </p>

      <form onSubmit={handleSubmit(save)} className="mt-5 flex flex-col gap-4">
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          error={errors.current?.message}
          {...register('current', { required: 'Your current password is required.' })}
        />

        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters."
          error={errors.password?.message}
          {...register('password', {
            required: 'Choose a new password.',
            minLength: { value: 10, message: 'Use at least 10 characters.' },
          })}
        />

        {/* Checked here rather than server-side: a typo in a password nobody
            can read back is the one mistake worth catching before it is saved. */}
        <Input
          label="Repeat new password"
          type="password"
          autoComplete="new-password"
          error={errors.repeat?.message}
          {...register('repeat', {
            validate: value => value === watch('password') || 'The two do not match.',
          })}
        />

        <div>
          <Button type="submit" size="sm" loading={isSubmitting}>
            Change password
          </Button>
        </div>
      </form>
    </section>
  )
}

export default Password
