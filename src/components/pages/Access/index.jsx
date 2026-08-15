import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../ui'
import { useAuth } from '../../../context/auth'

/**
 * One page for both signing in and creating an account.
 *
 * They are the same decision from the visitor's side — "get me into my account"
 * — and splitting them across two routes makes someone who guessed wrong start
 * over. The toggle keeps whatever they already typed.
 */
const Access = ({ mode = 'login' }) => {
  const { t } = useTranslation()
  const [creating, setCreating] = useState(mode === 'register')

  // What an account is actually for, in the order it happens. Not a feature
  // list: each line is a thing the app will or will not let you do, and the
  // third one is the only reason anyone is ever asked to confirm an address.
  const WHAT_YOU_GET = [
    t('Access.Get.Buy'),
    t('Access.Get.Sell'),
    t('Access.Get.Verify'),
  ]
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { username: '', email: '', password: '' } })

  const onSubmit = async (values) => {
    try {
      if (creating) {
        const created = await signUp(values)
        // Straight to the account, where the code entry is. Nothing else in the
        // app tells a new person that something is waiting on them.
        return navigate(created?.verified ? (location.state?.from ?? '/') : '/account', { replace: true })
      }

      await signIn({ email: values.email, password: values.password })
      // Back to wherever the guard interrupted, or the home page.
      navigate(location.state?.from ?? '/', { replace: true })
    } catch {
      // The interceptor has already shown what went wrong.
    }
  }

  return (
    <div className="shell py-8 sm:py-12">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-pz border border-line lg:grid-cols-[0.85fr_1fr]">
        {/* The one page in the app a person may land on before seeing anything
            else, so it is the one page that says what Plaza is.

            Below the form on a phone, beside it on a laptop. Someone who came
            here to sign in should not have to scroll past the pitch to reach
            the field they came for. */}
        <aside className="order-last flex flex-col justify-between gap-8 bg-accent-tint p-7 sm:p-9 lg:order-first">
          <div>
            <span className="block font-display text-2xl leading-none font-extrabold tracking-[-0.03em] text-ink">
              Plaza
            </span>
            <span
              aria-hidden
              className="mt-2 block h-[3px] w-16 rounded-full"
              style={{
                background:
                  'repeating-linear-gradient(90deg, var(--pz-accent) 0 25%, var(--pz-link) 25% 50%)',
              }}
            />
          </div>

          <ul className="flex flex-col gap-3.5">
            {WHAT_YOU_GET.map(line => (
              <li key={line} className="text-[15px] leading-snug text-muted">
                {line}
              </li>
            ))}
          </ul>
        </aside>

        <div className="bg-surface p-7 sm:p-9">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            {creating ? t('Access.CreateTitle') : t('Header.Account.SignIn')}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {creating ? t('Access.CreateSubtitle') : t('Access.WelcomeBack')}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 flex flex-col gap-5">
            {creating && (
              <Input
                label={t('Access.Username.Label')}
                autoComplete="username"
                error={errors.username?.message}
                {...register('username', { required: t('Access.Username.Required') })}
              />
            )}

            <Input
              label={t('Access.Email.Label')}
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email', { required: t('Access.Email.Required') })}
            />

            <Input
              label={t('Access.Password.Label')}
              type="password"
              autoComplete={creating ? 'new-password' : 'current-password'}
              hint={creating ? t('Access.Password.Hint') : undefined}
              error={errors.password?.message}
              {...register('password', {
                required: t('Access.Password.Required'),
                minLength: creating
                  ? { value: 8, message: t('Access.Password.MinLength') }
                  : undefined,
              })}
            />

            <Button.Action type="submit" full loading={isSubmitting} className="mt-1">
              {creating ? t('Access.CreateAccount') : t('Header.Account.SignIn')}
            </Button.Action>
          </form>

          <p className="mt-6 border-t border-line pt-5 text-sm text-muted">
            {creating ? t('Access.AlreadyHaveAccount') : t('Access.NewToPlaza')}{' '}
            <button
              type="button"
              onClick={() => setCreating(c => !c)}
              className="font-medium text-link hover:underline"
            >
              {creating ? t('Header.Account.SignIn') : t('Access.CreateOne')}
            </button>
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-sm">
        <Link to="/" className="text-muted transition-colors hover:text-ink">{t('Common.BackToPlaza')}</Link>
      </p>
    </div>
  )
}

export default Access
