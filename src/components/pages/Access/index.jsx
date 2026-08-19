import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../ui'
import { useAuth } from '../../../context/auth'
import { useMeta } from '../../../context/meta'

/**
 * One page for both signing in and creating an account.
 *
 * They are the same decision from the visitor's side — "get me into my account"
 * — and splitting them across two routes makes someone who guessed wrong start
 * over. The toggle keeps whatever they already typed.
 */
const Access = ({ mode = 'login' }) => {
  // Present only where the API chose to send it, which is development. The
  // frontend does not decide whether to show this and does not know the
  // password — both come from the server, so a production build cannot leak a
  // credential it was never given.
  const { demo } = useMeta()
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
    setValue,
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

          {/* Above the form and not below it: somebody who came here to look
              around rather than to sign in should find this before they start
              inventing an address. Hidden while creating an account, where it
              would be an answer to a question nobody asked. */}
          {demo && !creating && (
            <div className="mt-6 rounded-pz border border-line border-l-[3px] border-l-info bg-sunk p-4">
              <p className="text-sm font-semibold text-ink">{t('Access.Demo.Title')}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{t('Access.Demo.Body')}</p>

              <dl className="tabular mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
                <dt className="text-faint">{t('Access.Demo.Email')}</dt>
                <dd className="text-ink select-all">{demo.email}</dd>
                <dt className="text-faint">{t('Access.Demo.Password')}</dt>
                <dd className="text-ink select-all">{demo.password}</dd>
              </dl>

              {/* Typed for them. The password changes daily and is long enough
                  to mistype, and a demo account nobody can get into is worse
                  than none. */}
              <Button.Action
                type="button"
                variant="outline"
                color="neutral"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setValue('email', demo.email)
                  setValue('password', demo.password)
                }}
              >
                {t('Access.Demo.Fill')}
              </Button.Action>
            </div>
          )}

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
