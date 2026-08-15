import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from './auth'
import { notify } from '../utils/notify'
import cart from '../services/cart.services'

/**
 * The basket.
 *
 * A table, not this browser's storage. It started in localStorage on the
 * reasoning that a basket is an intention and most are abandoned, and that was
 * wrong the moment a seller pausing a listing had to empty it out of every
 * basket holding it: nothing on the server can reach into someone else's tab.
 *
 * The cost of the change is that a basket now needs an account. Adding to it is
 * the thing that asks for one, not looking at it.
 *
 * Only the count lives here. The lines themselves are the cart page's business,
 * and holding them app-wide would mean refetching a page of listings on every
 * navigation to keep a number in the header honest.
 */
const CartContext = createContext({
  count: 0,
  add: () => {},
  refresh: () => {},
  ready: false,
})

export const useCart = () => use(CartContext)

export const CartProvider = ({ children }) => {
  const { t } = useTranslation()
  const { account, ready: session } = useAuth()
  const [count, setCount] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    if (!account) return setCount(0)

    try {
      setCount(await cart.count())
    } catch {
      // The badge is not worth a toast. It shows nothing and the cart page
      // will say what happened when it is opened.
    }
  }, [account])

  useEffect(() => {
    // Signed out there is nothing to count. The zero is the initial state, so
    // there is nothing to write here either — and setState in the body of an
    // effect is a cascading render on every visit by a guest.
    if (!session || !account) return

    let ignore = false

    cart
      .count()
      .then(n => { if (!ignore) setCount(n) })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoaded(true) })

    return () => { ignore = true }
  }, [account, session])

  const add = useCallback(async (productId, quantity = 1) => {
    // Shown to everyone, because hiding the button hides the feature. It is the
    // click that needs an account, and saying so beats a silent 401.
    if (!account) return notify(t('Cart.SignInToAdd'), 'error')

    try {
      await cart.add(productId, quantity)
      await refresh()
      notify(t('Cart.AddedToCart'), 'success')
    } catch {
      // The interceptor says why: withdrawn, out of stock, or your own.
    }
  }, [account, refresh, t])

  const value = useMemo(
    () => ({ count: account ? count : 0, add, refresh, ready: !account || loaded }),
    [account, count, add, refresh, loaded],
  )

  return <CartContext value={value}>{children}</CartContext>
}
