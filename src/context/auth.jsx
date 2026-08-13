import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'
import auth from '../services/auth.services'

const AuthContext = createContext(null)

export const useAuth = () => {
  const value = use(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}

export const AuthProvider = ({ children }) => {
  const [account, setAccount] = useState(null)
  // Distinct from "signed out": until the session call comes back we do not
  // know which, and a guard that treats the gap as signed out bounces a signed
  // in person to the login page on every refresh.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    auth
      .session()
      .then(data => setAccount(data.account))
      .catch(() => setAccount(null))
      .finally(() => setReady(true))
  }, [])

  const signIn = useCallback(async (payload) => {
    const data = await auth.login(payload)
    setAccount(data.account)
    return data.account
  }, [])

  const signUp = useCallback(async (payload) => {
    const data = await auth.register(payload)
    setAccount(data.account)
    return data.account
  }, [])

  const signOut = useCallback(async () => {
    await auth.logout()
    setAccount(null)
  }, [])

  const value = useMemo(
    () => ({ account, ready, signIn, signUp, signOut, setAccount }),
    [account, ready, signIn, signUp, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
