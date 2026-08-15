import axios from 'axios'
import i18n from '../../i18n'
import { notify } from '../utils/notify'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // The session is a httpOnly cookie, so every request has to carry it.
  withCredentials: true,
})

// Every failure surfaces unless a caller opts out. A request that fails
// silently is the worst outcome: the person sees nothing happen and tries
// again, and the bug reaches production because nobody could describe it.
//
// `i18n.t` directly rather than the `useTranslation` hook: this file runs
// outside any component, in an axios interceptor, where there is no render to
// hook into. The server's own message, when there is one, is not translated
// here — that is a fact about the backend's current language, not this one.
api.interceptors.response.use(
  res => res,
  err => {
    if (!err.config?.quiet) {
      notify(
        err.response?.data?.message ||
          (err.response
            ? i18n.t('Api.RequestFailed', { status: err.response.status })
            : i18n.t('Api.Unreachable')),
        'error',
      )
    }
    return Promise.reject(err)
  },
)

export default api
