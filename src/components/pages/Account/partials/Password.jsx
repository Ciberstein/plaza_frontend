import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '../../../ui'
import { notify } from '../../../../utils/notify'
import account from '../../../../services/account.services'

const Password = () => {
  const { t } = useTranslation()
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
      notify(t('Password.Updated'), 'success')
    } catch {
      // The server does the real judging — length, reuse, common passwords —
      // and the interceptor shows whatever it said.
    }
  }

  return (
    <section className="panel p-6 sm:p-7">
      <h2 className="font-display text-lg font-semibold text-ink">{t('Access.Password.Label')}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {t('Password.Intro')}
      </p>

      <form onSubmit={handleSubmit(save)} className="mt-5 flex flex-col gap-4">
        <Input
          label={t('Password.Current.Label')}
          type="password"
          autoComplete="current-password"
          error={errors.current?.message}
          {...register('current', { required: t('Password.Current.Required') })}
        />

        <Input
          label={t('Password.New.Label')}
          type="password"
          autoComplete="new-password"
          hint={t('Password.New.Hint')}
          error={errors.password?.message}
          {...register('password', {
            required: t('Password.New.Required'),
            minLength: { value: 10, message: t('Password.New.MinLength') },
          })}
        />

        {/* Checked here rather than server-side: a typo in a password nobody
            can read back is the one mistake worth catching before it is saved. */}
        <Input
          label={t('Password.Repeat.Label')}
          type="password"
          autoComplete="new-password"
          error={errors.repeat?.message}
          {...register('repeat', {
            validate: value => value === watch('password') || t('Password.Repeat.Mismatch'),
          })}
        />

        <div>
          <Button.Action type="submit" size="sm" loading={isSubmitting}>
            {t('Password.Change')}
          </Button.Action>
        </div>
      </form>
    </section>
  )
}

export default Password
