import api from '../api/axios'
import { API_ROUTES } from '../api/routes'

const auth = {
  register: (payload) => api.post(`${API_ROUTES.AUTH}/register`, payload).then(r => r.data),
  login: (payload) => api.post(`${API_ROUTES.AUTH}/login`, payload).then(r => r.data),
  logout: () => api.post(`${API_ROUTES.AUTH}/logout`).then(r => r.data),

  // Asked once on boot to find out whether the cookie still holds. `quiet`
  // because a signed-out visitor is the normal case, not an error to report.
  session: () => api.get(`${API_ROUTES.AUTH}/session`, { quiet: true }).then(r => r.data),
}

export default auth
