import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import { Button } from '../../ui'
import { useAuth } from '../../../context/auth'

/**
 * What it takes to start selling, which is almost nothing.
 *
 * A listing belongs to the person who made it. The shop is optional branding on
 * top of it — that is how the products table is built, and until now the
 * interface said the opposite, advertising the shop on seven screens as if it
 * were the way in.
 *
 * The call to action is whatever is actually in this person's way. For most of
 * them that is a confirmed email and nothing else.
 */
const StartSelling = () => {
  const { t } = useTranslation()
  const { account, ready } = useAuth()

  // Nothing is claimed about the visitor until the session check answers,
  // so the page does not offer to create an account they already have.
  if (!ready) return <div className="mt-7 h-11" aria-hidden />

  if (!account) {
    return (
      <div className="mt-7">
        <Button.Action as={Link} to="/access" size="lg">{t('Sell.Get.Account')}</Button.Action>
      </div>
    )
  }

  if (!account.verified) {
    return (
      <div className="mt-7">
        <Button.Action as={Link} to="/account" size="lg">{t('Sell.Get.ConfirmEmail')}</Button.Action>
        <p className="mt-3 text-sm text-muted">
          {t('Sell.Get.CodeSentTo', { email: account.email })}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-7">
      <Button.Action as={Link} to="/listings/new" size="lg">{t('Sell.Get.ListItem')}</Button.Action>
      <p className="mt-3 flex items-center gap-2 text-sm text-muted">
        <CheckCircleIcon className="size-4 shrink-0 text-good" />
        {t('Sell.Get.EmailConfirmed')}
      </p>
    </div>
  )
}

const Sell = () => {
  const { t } = useTranslation()

  return (
    <div className="shell py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="rule-accent font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {t('Common.SellOnPlaza')}
        </h1>
        <p className="mt-5 max-w-prose text-[15px] leading-relaxed text-muted">
          {t('Sell.Intro')}
        </p>

        <StartSelling />

        {/* The rule is the demotion. Everything above it is what Plaza asks
            people to do; everything below it is the exception, and it reads
            smaller and quieter for exactly that reason. */}
        <section className="mt-12 border-t border-line pt-10">
          <h2 className="font-display text-xl font-semibold text-ink">{t('Sell.ShopsTitle')}</h2>
          <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-muted">
            {t('Sell.ShopsBody')}
          </p>

          <div className="mt-6">
            <Button.Action as={Link} to="/sell/shop" variant="outline" color="neutral" size="sm">
              {t('Header.Account.RequestShop')}
            </Button.Action>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Sell
