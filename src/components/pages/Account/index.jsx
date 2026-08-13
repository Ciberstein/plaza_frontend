import { useCallback, useState } from 'react'
import { useAuth } from '../../../context/auth'
import { useResource } from '../../../hooks/useResource'
import accountService from '../../../services/account.services'
import Email from './partials/Email'
import Password from './partials/Password'
import Profile from './partials/Profile'
import Verify from './partials/Verify'

const Account = () => {
  const { account: session, setAccount } = useAuth()

  const load = useCallback(() => accountService.me(), [])
  const { data, loading } = useResource(load, 'me')

  // Held locally as well as in the session so a save updates this page and the
  // header at the same time, without a refetch.
  const [edited, setEdited] = useState(null)
  const me = edited ?? data

  const apply = (updated) => {
    setEdited(updated)
    setAccount(current => ({ ...current, ...updated }))
  }

  if (loading && !me) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="card h-28 animate-pulse" />
        <div className="card h-56 animate-pulse" />
      </div>
    )
  }

  if (!me) return null

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-medium">Your account</h1>
        <p className="mt-0.5 text-sm text-plaza-muted">
          Signed in as {session?.email}
        </p>
      </div>

      <Verify me={me} onChange={apply} />
      <Profile me={me} onChange={apply} />
      <Email me={me} onChange={apply} />
      <Password />
    </div>
  )
}

export default Account
