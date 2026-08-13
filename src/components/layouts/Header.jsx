import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { MagnifyingGlassIcon, ShoppingCartIcon, UserIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { useMeta } from '../../context/meta'
import { option, panel } from '../ui/styles'

// The brand mark is an awning: five painted slats over the wordmark, in the same
// dyed canvas the shop cards use. The square and the stalls in it are marked the
// same way.
const Wordmark = () => (
  <Link to="/" className="flex shrink-0 flex-col gap-1" aria-label="Plaza, home">
    <span className="flex gap-0.75" aria-hidden>
      {['#c2872c', '#a6462f', '#6b7639', '#2e6e6b', '#3a5480'].map(canvas => (
        <span key={canvas} className="h-1.5 w-3 rounded-t-xs" style={{ background: canvas }} />
      ))}
    </span>
    <span className="text-2xl font-bold leading-none tracking-tight text-plaza-paper">
      Plaza
    </span>
  </Link>
)

// Search is the primary navigation of a marketplace: people arrive knowing what
// they want far more often than they arrive wanting to browse. It gets the
// widest element in the band.
const Search = () => {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const submit = (event) => {
    event.preventDefault()
    const q = new FormData(event.currentTarget).get('q').toString().trim()
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/')
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      className="flex w-full max-w-2xl overflow-hidden rounded-plaza bg-plaza-paper"
    >
      <label htmlFor="plaza-search" className="sr-only">Search the plaza</label>
      <input
        id="plaza-search"
        name="q"
        type="search"
        defaultValue={params.get('q') ?? ''}
        placeholder="Search shops by name or what they sell"
        className="min-w-0 grow px-4 py-2.5 text-sm text-plaza-ink placeholder:text-plaza-mute focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Search"
        className="flex items-center bg-plaza-marigold px-4 text-plaza-ink transition-colors hover:bg-plaza-marigold/85"
      >
        <MagnifyingGlassIcon className="size-5" />
      </button>
    </form>
  )
}

const chrome = 'flex items-center gap-2 rounded-plaza px-3 py-2 text-sm text-plaza-paper/90 transition-colors hover:bg-plaza-paper/10'

const Account = () => {
  const { account, ready, signOut } = useAuth()
  const navigate = useNavigate()

  const out = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      {/* Nothing is claimed about the visitor until the session check answers,
          so the control does not flicker from "Sign in" to their name. */}
      {!ready ? (
        <span className={clsx(chrome, 'opacity-0')} aria-hidden>Sign in</span>
      ) : account ? (
        <Menu>
          <MenuButton className={chrome}>
            <UserIcon className="size-5" />
            <span className="hidden max-w-32 truncate sm:inline">{account.username}</span>
          </MenuButton>
          <MenuItems anchor="bottom end" className={clsx(panel, 'w-52')}>
            <MenuItem>
              <Link to="/dashboard" className={option}>Your shops</Link>
            </MenuItem>
            <MenuItem>
              <Link to="/sell" className={option}>Open a shop</Link>
            </MenuItem>
            <MenuItem>
              <button type="button" onClick={out} className={clsx(option, 'w-full text-left')}>
                Sign out
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>
      ) : (
        <NavLink to="/access" className={chrome}>
          <UserIcon className="size-5" />
          <span className="hidden sm:inline">Sign in</span>
        </NavLink>
      )}

      <NavLink to="/cart" className={chrome}>
        <ShoppingCartIcon className="size-5" />
        <span className="hidden sm:inline">Cart</span>
      </NavLink>
    </div>
  )
}

const Header = () => {
  const { categories } = useMeta()

  return (
    <header className="bg-plaza-pine">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Wordmark />
        <div className="order-3 w-full sm:order-0 sm:w-auto sm:grow">
          <Search />
        </div>
        <Account />
      </div>

      {/* Categories sit under the band, on a darker slat, so the row reads as
          part of the chrome rather than as page content. */}
      <nav aria-label="Categories" className="border-t border-plaza-paper/10 bg-plaza-ink/25">
        <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-1.5 text-sm">
          {categories.map(cat => (
            <li key={cat.value}>
              <NavLink
                to={`/c/${cat.value}`}
                className={({ isActive }) =>
                  clsx(
                    'block whitespace-nowrap rounded-plaza px-3 py-1 transition-colors',
                    isActive
                      ? 'bg-plaza-paper/15 text-plaza-paper'
                      : 'text-plaza-paper/75 hover:text-plaza-paper',
                  )
                }
              >
                {cat.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

export default Header
