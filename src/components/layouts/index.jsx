import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router-dom'
import Header from './Header'

/**
 * `main` does not clamp its width. Each page opens its own `.shell`, which lets
 * a page run a section across the full window while everything inside it still
 * lines up with the header above.
 */
export const Public = () => {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <main className="grow">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="shell flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <span className="block font-display text-lg leading-none font-extrabold tracking-[-0.03em] text-ink">
              Plaza
            </span>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {t('Footer.Tagline')}
            </p>
          </div>

          <nav aria-label={t('Footer.Nav.Label')} className="flex flex-col gap-2.5 text-sm">
            <Link to="/sell" className="w-fit font-medium text-link hover:underline">
              {t('Common.SellOnPlaza')}
            </Link>
            <Link to="/shops" className="w-fit text-muted transition-colors hover:text-ink">
              {t('Footer.Nav.Shops')}
            </Link>
            <Link to="/account" className="w-fit text-muted transition-colors hover:text-ink">
              {t('Footer.Nav.Account')}
            </Link>
            <Link to="/dashboard" className="w-fit text-muted transition-colors hover:text-ink">
              {t('Footer.Nav.Shops.Own')}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
