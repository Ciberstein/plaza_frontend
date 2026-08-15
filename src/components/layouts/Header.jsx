import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react'
import { ChevronDownIcon, GlobeAltIcon, MagnifyingGlassIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useMatch, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { useCart } from '../../context/cart'
import { useLanguage } from '../../context/language'
import { useMeta } from '../../context/meta'
import { option, panel } from '../ui/styles'
import { Avatar } from '../ui'
import { withCategoryLabels } from '../../utils/vocabulary'

/**
 * The wordmark, sitting on the band rather than on the page.
 *
 * White on the brand green, with a hairline under it: on a solid field of
 * colour the mark does not need a second colour of its own, and giving it one
 * would put two brand colours in the same 26 pixels.
 */
const Wordmark = () => {
  const { t } = useTranslation()

  return (
    <Link to="/" className="group shrink-0" aria-label={t('Header.Wordmark.Home')}>
      <span className="block font-display text-[26px] leading-none font-extrabold tracking-[-0.03em] text-white">
        Plaza
      </span>
      <span
        aria-hidden
        className="mt-1.5 block h-0.75 w-full rounded-full bg-white/70 transition-transform duration-200 ease-pz group-hover:scale-x-105"
      />
    </Link>
  )
}

/**
 * Search, with the category picker built into the same bar.
 *
 * The categories used to be a row of links under the header, which is fine for
 * six and breaks at twenty: they either wrapped onto a second line or scrolled
 * sideways, and a nav you have to drag is a nav nobody reads past the third
 * item. A list holds any number of them in the same space.
 *
 * Picker, hairline, field and submit share one rounded container rather than
 * sitting next to each other, because the scope and the words being searched
 * are one question. Two adjacent controls would read as two.
 */
const Search = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { categories: rawCategories } = useMeta()
  const categories = withCategoryLabels(language, rawCategories)
  const [params] = useSearchParams()
  const navigate = useNavigate()

  // The open category comes from the URL rather than from state, so the picker
  // still shows the right thing after a reload or a back button.
  const match = useMatch('/c/:category')
  const slug = match?.params.category ?? null
  const q = params.get('q')?.trim() ?? ''

  const go = (nextSlug, query) => {
    const search = query ? `?q=${encodeURIComponent(query)}` : ''
    navigate(nextSlug ? `/c/${nextSlug}${search}` : `/${search}`)
  }

  const submit = (event) => {
    event.preventDefault()
    go(slug, new FormData(event.currentTarget).get('q').toString().trim())
  }

  const label = categories.find(c => c.slug === slug)?.label ?? t('Header.Search.All')

  return (
    <form
      role="search"
      onSubmit={submit}
      className="flex h-10 w-full items-center rounded-full bg-surface p-1">
      <Listbox value={slug} onChange={next => go(next, q)}>
        <ListboxButton
          aria-label={t('Header.Search.InCategory', { category: label })}
          className={clsx("flex cursor-pointer items-center gap-1 rounded-full px-4 text-sm h-full",
            "transition-colors hover:bg-sunk hover:text-ink focus-visible:outline-accent"
          )}
        >
          <span className="max-w-24 truncate sm:max-w-40">{label}</span>
          <ChevronDownIcon className="size-4 shrink-0" />
        </ListboxButton>

        <ListboxOptions
          anchor="bottom start"
          transition
          className={clsx(panel, 'w-64 origin-top transition duration-100 ease-out data-closed:scale-98 data-closed:opacity-0')}
        >
          <ListboxOption value={null} className={option}>
            <span className="truncate group-data-selected:font-semibold group-data-selected:text-link">
              {t('Header.Search.All')}
            </span>
            <CheckIcon className="size-4 shrink-0 text-link opacity-0 group-data-selected:opacity-100" />
          </ListboxOption>

          {categories.map(cat => (
            <ListboxOption key={cat.value} value={cat.slug} className={option}>
              <span className="truncate group-data-selected:font-semibold group-data-selected:text-link">
                {cat.label}
              </span>
              <CheckIcon className="size-4 shrink-0 text-link opacity-0 group-data-selected:opacity-100" />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
      <label htmlFor="plaza-search" className="sr-only">{t('Header.Search.Label')}</label>
      <input
        id="plaza-search"
        name="q"
        type="text"
        defaultValue={q}
        placeholder={t('Header.Search.Placeholder')}
        className="min-w-0 grow bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none"
      />
      <button
        type="submit"
        aria-label={t('Header.Search.Submit')}
        className={clsx("rounded-full text-muted flex justify-center items-center h-full aspect-square",
          "transition-colors hover:bg-sunk hover:text-ink focus-visible:outline-accent")}
      >
        <MagnifyingGlassIcon className="size-5" />
      </button>
    </form>
  )
}

const link = clsx(
  'flex items-center gap-2 whitespace-nowrap rounded-pz-sm p-1.5 cursor-pointer',
  'text-sm font-medium text-white/90 transition-colors hover:bg-white/15 hover:text-white',
  // The page-wide focus outline is green, which is invisible on the band.
  'focus-visible:outline-white',
)

const Account = () => {
  const { t } = useTranslation()
  const { account, ready, signOut } = useAuth()
  const navigate = useNavigate()

  const out = async () => {
    await signOut()
    navigate('/')
  }

  // Nothing is claimed about the visitor until the session check answers, so
  // the control does not flicker from "Sign in" to their name.
  if (!ready) return <span className={clsx(link, 'opacity-0')} aria-hidden>{t('Header.Account.SignIn')}</span>

  if (!account) return <NavLink to="/access" className={link}>{t('Header.Account.SignIn')}</NavLink>

  return (
    <Menu>
      <MenuButton className={clsx(link, 'rounded-full! p-1! pr-4! h-10!')}>
        <Avatar account={account} size="sm" />
        <span className="hidden max-w-32 truncate sm:inline">{account.username}</span>
        <ChevronDownIcon className="size-4 text-white/70" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        transition
        className={clsx(panel, 'w-60 origin-top-right transition duration-150 ease-pz data-closed:scale-95 data-closed:opacity-0')}
      >
        <MenuItem>
          <Link to="/account" className={option}>
            {t('Header.Account.YourAccount')}
            {/* The one place the person is told, wherever they are in the app,
                that something is waiting on them. */}
            {!account.verified && (
              <span className="rounded-pz-sm bg-info px-1.5 py-0.5 text-[11px] font-semibold text-on-info">
                {t('Header.Account.ConfirmEmail')}
              </span>
            )}
          </Link>
        </MenuItem>
        <MenuItem>
          <Link to="/saved" className={option}>{t('Header.Account.Saved')}</Link>
        </MenuItem>
        <MenuItem>
          <Link to="/purchases" className={option}>{t('Header.Account.YourPurchases')}</Link>
        </MenuItem>
        <MenuItem>
          <Link to="/sales" className={option}>{t('Header.Account.YourSales')}</Link>
        </MenuItem>
        <MenuItem>
          <Link to="/listings" className={option}>{t('Header.Account.YourListings')}</Link>
        </MenuItem>
        <MenuItem>
          <Link to="/dashboard" className={option}>{t('Header.Account.YourShops')}</Link>
        </MenuItem>
        <MenuItem>
          <Link to="/sell/shop" className={option}>{t('Header.Account.RequestShop')}</Link>
        </MenuItem>
        <div className="my-1.5 h-px bg-line" />
        <MenuItem>
          <Link to="#" onClick={out} className={option}>{t('Header.Account.SignOut')}</Link>
        </MenuItem>
      </MenuItems>
    </Menu>
  )
}

const secondary = ({ isActive }) =>
  clsx(
    'block whitespace-nowrap rounded-pz-sm px-2 py-1 text-[13px] transition-colors',
    'focus-visible:outline-white',
    isActive
      ? 'font-semibold text-white'
      : 'text-white/70 hover:bg-white/10 hover:text-white',
  )

/** A basket you cannot see is one you forget you filled. */
const Cart = () => {
  const { t } = useTranslation()
  const { count } = useCart()

  return (
    <NavLink
      to="/cart"
      className={clsx(link, 'relative size-10 items-center justify-center rounded-full!')}
      aria-label={count ? t('Header.Cart.LabelWithCount', { count }) : t('Header.Cart.Label')}
    >
      <ShoppingBagIcon className="size-5" />

      {count > 0 && (
        <span className="tabular absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-info px-1 text-[11px] font-bold text-on-info">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </NavLink>
  )
}

/**
 * ES / EN / PT, plain text rather than flags.
 *
 * A flag names a country, not a language, and Spanish alone is spoken across
 * a dozen of them — there is no single flag for it that does not quietly
 * privilege one country over the rest of the audience.
 */
const LanguageSwitcher = () => {
  const { t } = useTranslation()
  const { language, languages, setLanguage } = useLanguage()
  const current = languages.find(l => l.value === language)

  return (
    <Listbox value={language} onChange={setLanguage}>
      <ListboxButton
        aria-label={t('Header.Language.Label')}
        className="flex cursor-pointer items-center gap-1 rounded-pz-sm px-2 py-1 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-white"
      >
        <GlobeAltIcon className="size-4" />
        {current?.value.toUpperCase()}
      </ListboxButton>

      <ListboxOptions
        anchor="bottom end"
        transition
        className={clsx(panel, 'w-36 origin-top-right transition duration-100 ease-out data-closed:scale-98 data-closed:opacity-0')}
      >
        {languages.map(l => (
          <ListboxOption key={l.value} value={l.value} className={option}>
            <span className="truncate group-data-selected:font-semibold group-data-selected:text-link">
              {l.label}
            </span>
            <CheckIcon className="size-4 shrink-0 text-link opacity-0 group-data-selected:opacity-100" />
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  )
}

const Header = () => {
  const { t } = useTranslation()

  return (
    // Solid, and the brand colour, the way a marketplace header is: it is the
    // one element on every page, so it is the one element that has to be
    // recognisable before anything has loaded.
    <header className="sticky top-0 z-40 bg-accent">
      <div className="shell flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3">
        <Wordmark />

        <div className="order-3 w-full sm:order-0 sm:w-auto sm:max-w-3xl sm:grow">
          <Search />
        </div>

        <div className="flex items-center gap-2">
          <Account />
          <Cart />
        </div>
      </div>

      {/* The same green a shade deeper. The categories moved into the search
          bar, so this row is free for the handful of destinations that are not
          a category and not an account setting. */}
      <nav aria-label={t('Header.Nav.Sections')} className="bg-accent-deep">
        <ul className="shell flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none [&::-webkit-scrollbar]:hidden">
          <li>
            <NavLink to="/shops" className={secondary}>{t('Header.Nav.Shops')}</NavLink>
          </li>
          <li>
            <NavLink to="/sell" className={secondary}>{t('Common.SellOnPlaza')}</NavLink>
          </li>
          <li className="ml-auto">
            <LanguageSwitcher />
          </li>
        </ul>
      </nav>
    </header>
  )
}

export default Header
