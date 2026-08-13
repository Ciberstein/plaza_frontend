import api from '../api/axios'
import { API_ROUTES } from '../api/routes'

const shops = {
  // Public — the square.
  browse: (params) => api.get(`${API_ROUTES.PUBLIC}/shops`, { params }).then(r => r.data),
  storefront: (slug) => api.get(`${API_ROUTES.PUBLIC}/shops/${slug}`).then(r => r.data),

  // Mine — behind the session.
  mine: () => api.get(`${API_ROUTES.USER}/shops`).then(r => r.data),
  create: (payload) => api.post(`${API_ROUTES.USER}/shops`, payload).then(r => r.data),
  update: (id, payload) => api.patch(`${API_ROUTES.USER}/shops/${id}`, payload).then(r => r.data),
}

export default shops
