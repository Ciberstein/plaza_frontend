import api from '../api/axios'
import { API_ROUTES } from '../api/routes'

const products = {
  // Public — the square.
  browse: (params) => api.get(`${API_ROUTES.PUBLIC}/products`, { params }).then(r => r.data),
  read: (id) => api.get(`${API_ROUTES.PUBLIC}/products/${id}`).then(r => r.data),

  // Mine — behind the session.
  mine: () => api.get(`${API_ROUTES.USER}/products`).then(r => r.data),
  get: (id) => api.get(`${API_ROUTES.USER}/products/${id}`).then(r => r.data),
  create: (payload) => api.post(`${API_ROUTES.USER}/products`, payload).then(r => r.data),
  update: (id, payload) => api.patch(`${API_ROUTES.USER}/products/${id}`, payload).then(r => r.data),

  // Each transition is its own call rather than a status field, because each
  // carries a different rule. Publishing is the one that checks them.
  publish: (id) => api.post(`${API_ROUTES.USER}/products/${id}/publish`).then(r => r.data),
  archive: (id) => api.post(`${API_ROUTES.USER}/products/${id}/archive`).then(r => r.data),

  // One file per request, the way the avatar and the shop logo already work.
  addImage: (id, file) => {
    const body = new FormData()
    body.append('image', file)
    return api.post(`${API_ROUTES.USER}/products/${id}/images`, body).then(r => r.data)
  },
  removeImage: (id, imageId) =>
    api.delete(`${API_ROUTES.USER}/products/${id}/images/${imageId}`).then(r => r.data),
  reorderImages: (id, order) =>
    api.patch(`${API_ROUTES.USER}/products/${id}/images`, { order }).then(r => r.data),
}

export default products
