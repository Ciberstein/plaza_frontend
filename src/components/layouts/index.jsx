import { Link, Outlet } from 'react-router-dom'
import Header from './Header'

/**
 * `main` does not clamp its width. Each page opens its own `.shell`, which lets
 * a page run a section across the full window while everything inside it still
 * lines up with the header above.
 */
export const Public = () => (
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
            A market where people sell what they make, under their own name or a shop's.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2.5 text-sm">
          <Link to="/sell" className="w-fit font-medium text-link hover:underline">
            Sell on Plaza
          </Link>
          <Link to="/shops" className="w-fit text-muted transition-colors hover:text-ink">
            Shops
          </Link>
          <Link to="/account" className="w-fit text-muted transition-colors hover:text-ink">
            Your account
          </Link>
          <Link to="/dashboard" className="w-fit text-muted transition-colors hover:text-ink">
            Your shops
          </Link>
        </nav>
      </div>
    </footer>
  </div>
)
