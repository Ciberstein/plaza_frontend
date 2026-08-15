import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/auth'

/**
 * Wraps a route that needs an account.
 *
 * `ready` matters as much as `account`: on a page refresh the session check is
 * still in flight, and treating that moment as signed out throws a signed in
 * person back to the sign-in page every time they reload.
 */
const Protected = ({ children }) => {
  const { t } = useTranslation()
  const { account, ready } = useAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="shell py-20 text-center">
        <p className="text-sm text-muted">{t('Common.OneMoment')}</p>
      </div>
    )
  }

  // The destination is remembered so they land where they were headed rather
  // than on the home page once they are in.
  if (!account) return <Navigate to="/access" state={{ from: location.pathname }} replace />

  return children
}

export default Protected
