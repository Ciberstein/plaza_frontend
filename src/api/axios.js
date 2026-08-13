import axios from 'axios'
import { notify } from '../utils/notify'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // The session is a httpOnly cookie, so every request has to carry it.
  withCredentials: true,
})

// Every failure surfaces unless a caller opts out. A request that fails
// silently is the worst outcome: the person sees nothing happen and tries
// again, and the bug reaches production because nobody could describe it.
api.interceptors.response.use(
  res => res,
  err => {
    if (!err.config?.quiet) {
      notify(
        err.response?.data?.message ||
          (err.response
            ? `That request failed (${err.response.status}).`
            : 'Could not reach the server. Check that the API is running.'),
        'error',
      )
    }
    return Promise.reject(err)
  },
)

export default api
