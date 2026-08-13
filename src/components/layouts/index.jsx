import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import Header from './Header'

export const Public = () => (
  <div className="flex min-h-dvh flex-col">
    <Header />
    <main className="mx-auto w-full max-w-[1200px] grow px-4 py-5">
      <Outlet />
    </main>
    <footer className="mt-6 border-t border-plaza-line bg-plaza-surface">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-plaza-muted">
        <span>Plaza</span>
        <Link to="/sell" className="text-plaza-action hover:underline">
          Sell on Plaza
        </Link>
      </div>
    </footer>
  </div>
)
