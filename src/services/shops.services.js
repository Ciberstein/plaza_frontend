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

  // Each transition is its own call rather than a status field, because each
  // carries a different rule. Going live is not among them: that is an
  // administrator's decision.
  submit: (id) => api.post(`${API_ROUTES.USER}/shops/${id}/submit`).then(r => r.data),
  withdraw: (id) => api.post(`${API_ROUTES.USER}/shops/${id}/withdraw`).then(r => r.data),
  close: (id) => api.post(`${API_ROUTES.USER}/shops/${id}/close`).then(r => r.data),
  reopen: (id) => api.post(`${API_ROUTES.USER}/shops/${id}/reopen`).then(r => r.data),
}

export default shops
