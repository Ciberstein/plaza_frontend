import { Outlet } from 'react-router-dom'
import Header from './Header'

export const Public = () => (
  <div className="flex min-h-dvh flex-col">
    <Header />
    <main className="mx-auto w-full max-w-7xl grow px-4 py-6">
      <Outlet />
    </main>
    <footer className="border-t border-plaza-line bg-plaza-paper">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-sm text-plaza-mute">
        <span>Plaza — a square where anyone can open a stall.</span>
        <a href="/sell" className="text-plaza-pine hover:underline">
          Open your shop
        </a>
      </div>
    </footer>
  </div>
)
