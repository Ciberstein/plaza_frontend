import api from '../api/axios'
import { API_ROUTES } from '../api/routes'

const cart = {
  // Only the number, for the badge. Quiet so a signed-out visitor does not get
  // a toast about an endpoint they were never meant to reach.
  count: () => api.get(`${API_ROUTES.USER}/cart/count`, { quiet: true }).then(r => r.data.count),

  list: () => api.get(`${API_ROUTES.USER}/cart`).then(r => r.data),

  add: (productId, quantity = 1) =>
    api.post(`${API_ROUTES.USER}/cart/${productId}`, { quantity }).then(r => r.data),

  setQuantity: (productId, quantity) =>
    api.patch(`${API_ROUTES.USER}/cart/${productId}`, { quantity }).then(r => r.data),

  remove: (productId) => api.delete(`${API_ROUTES.USER}/cart/${productId}`).then(() => productId),

  clear: () => api.delete(`${API_ROUTES.USER}/cart`).then(() => true),
}

export default cart
