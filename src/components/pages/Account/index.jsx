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
      <div className="shell py-8 sm:py-10" aria-hidden>
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          <div className="panel h-28 animate-pulse" />
          <div className="panel h-56 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!me) return null

  return (
    <div className="shell py-8 sm:py-10">
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <div>
          <h1 className="rule-accent font-display text-3xl font-bold tracking-tight text-ink">
            Your account
          </h1>
          <p className="mt-4 text-sm text-muted">Signed in as {session?.email}</p>
        </div>

        <Verify me={me} onChange={apply} />
        <Profile me={me} onChange={apply} />
        <Email me={me} onChange={apply} />
        <Password />
      </div>
    </div>
  )
}

export default Account
