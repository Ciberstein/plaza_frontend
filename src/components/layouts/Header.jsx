import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon, MagnifyingGlassIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { useMeta } from '../../context/meta'
import { option, panel } from '../ui/styles'
import { Avatar } from '../ui'

const Wordmark = () => (
  <Link
    to="/"
    className="shrink-0 text-2xl font-bold leading-none tracking-tight text-white"
  >
    Plaza
  </Link>
)

// Search is the primary navigation of a marketplace: people arrive knowing what
// they want far more often than they arrive wanting to browse. It takes the
// widest element in the band, and the submit is a grey magnifier rather than a
// coloured button — against a bright band a second strong colour just competes.
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
      className="flex w-full items-center rounded-plaza bg-plaza-surface shadow-sm"
    >
      <label htmlFor="plaza-search" className="sr-only">Search Plaza</label>
      <input
        id="plaza-search"
        name="q"
        type="search"
        defaultValue={params.get('q') ?? ''}
        placeholder="Search shops, products and brands"
        className="min-w-0 grow bg-transparent px-4 py-2.5 text-sm text-plaza-ink placeholder:text-plaza-faint focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Search"
        className="border-l border-plaza-line px-3.5 py-2.5 text-plaza-muted transition-colors hover:text-plaza-ink"
      >
        <MagnifyingGlassIcon className="size-5" />
      </button>
    </form>
  )
}

const link = 'flex items-center gap-1.5 whitespace-nowrap rounded-plaza px-2 py-1.5 text-sm text-white/85 transition-colors hover:text-white'

const Account = () => {
  const { account, ready, signOut } = useAuth()
  const navigate = useNavigate()

  const out = async () => {
    await signOut()
    navigate('/')
  }

  // Nothing is claimed about the visitor until the session check answers, so
  // the control does not flicker from "Sign in" to their name.
  if (!ready) return <span className={clsx(link, 'opacity-0')} aria-hidden>Sign in</span>

  if (!account) {
    return (
      <>
        <NavLink to="/access" className={link}>Sign in</NavLink>
        <NavLink to="/sell" className={link}>Sell</NavLink>
      </>
    )
  }

  return (
    <Menu>
      <MenuButton className={link}>
        <Avatar account={account} size="sm" className="size-7" />
        <span className="hidden max-w-32 truncate sm:inline">{account.username}</span>
        <ChevronDownIcon className="size-4" />
      </MenuButton>
      <MenuItems anchor="bottom end" className={clsx(panel, 'w-56')}>
        <MenuItem>
          <Link to="/account" className={option}>
            Your account
            {/* The one place the person is told, wherever they are in the app,
                that something is waiting on them. */}
            {!account.verified && (
              <span className="rounded-plaza bg-plaza-deal/10 px-1.5 py-0.5 text-xs font-medium text-plaza-deal">
                Confirm email
              </span>
            )}
          </Link>
        </MenuItem>
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
  )
}

const Header = () => {
  const { categories } = useMeta()

  return (
    <header className="bg-plaza-band">
      {/* Row one: identity and search. */}
      <div className="mx-auto flex max-w-300 flex-wrap items-center gap-x-6 gap-y-2 px-4 pt-3">
        <Wordmark />
        <div className="order-3 w-full sm:order-0 sm:w-auto sm:grow">
          <Search />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Account />
          <NavLink to="/cart" className={link} aria-label="Cart">
            <ShoppingCartIcon className="size-5" />
          </NavLink>
        </div>
      </div>

      {/* Row two: the categories, on the same band a shade deeper. Keeping them
          inside the band rather than on a bar of their own is what makes the
          header read as one object. */}
      <nav aria-label="Categories" className="mt-2 bg-plaza-band-deep">
        <ul className="mx-auto flex max-w-300 gap-1 overflow-x-auto px-4 py-1.5">
          {categories.map(cat => (
            <li key={cat.value}>
              <NavLink
                to={`/c/${cat.slug}`}
                className={({ isActive }) =>
                  clsx(
                    'block whitespace-nowrap rounded-plaza px-2.5 py-1 text-sm transition-colors',
                    isActive
                      ? 'bg-white/15 font-medium text-white'
                      : 'text-white/75 hover:text-white',
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
