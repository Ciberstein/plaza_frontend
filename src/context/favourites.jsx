import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from './auth'
import { notify } from '../utils/notify'
import favourites from '../services/favourites.services'

/**
 * Which listings this person has kept.
 *
 * Held as a Set of ids for the whole app, because the question every card asks
 * is "is this one mine" and it asks it forty-eight times per page. Fetching the
 * full list for that would be a page of joins to fill in some hearts.
 *
 * The toggle moves the heart first and calls the API after. A favourite is not
 * a payment: if the request fails the heart goes back, and the cost of being
 * briefly wrong is far lower than the cost of a control that feels broken.
 */
const EMPTY = new Set()

const FavouritesContext = createContext({
  ids: new Set(),
  has: () => false,
  toggle: () => {},
  ready: false,
})

export const useFavourites = () => use(FavouritesContext)

export const FavouritesProvider = ({ children }) => {
  const { account, ready: session } = useAuth()
  const [kept, setKept] = useState(() => new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Signed out there is nothing to ask for, and the empty set is derived
    // below rather than written here: setState in the body of an effect is a
    // cascading render, and this one would fire on every visit by a guest.
    if (!session || !account) return

    let ignore = false

    favourites
      .ids()
      .then(list => { if (!ignore) setKept(new Set(list)) })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoaded(true) })

    return () => { ignore = true }
  }, [account, session])

  const guest = session && !account
  const ids = guest ? EMPTY : kept
  const ready = guest || loaded

  const has = useCallback((productId) => ids.has(productId), [ids])

  const toggle = useCallback(async (productId) => {
    // The heart is shown to everyone, because hiding it hides the feature. It
    // is the click that needs an account, and saying so beats a silent 401.
    if (!account) return notify('Sign in to save things you like.', 'error')

    const held = ids.has(productId)

    setKept(current => {
      const next = new Set(current)
      if (held) next.delete(productId)
      else next.add(productId)
      return next
    })

    try {
      if (held) await favourites.remove(productId)
      else await favourites.add(productId)
    } catch {
      // Put it back. The interceptor has already said why.
      setKept(current => {
        const next = new Set(current)
        if (held) next.add(productId)
        else next.delete(productId)
        return next
      })
    }
  }, [ids, account])

  const value = useMemo(() => ({ ids, has, toggle, ready }), [ids, has, toggle, ready])

  return <FavouritesContext value={value}>{children}</FavouritesContext>
}
