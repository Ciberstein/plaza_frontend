import api from '../api/axios'
import { API_ROUTES } from '../api/routes'

const favourites = {
  // Only the ids. Every grid needs to know which hearts are filled before it
  // paints, and that question fits in an array of numbers.
  ids: () => api.get(`${API_ROUTES.USER}/favourites/ids`, { quiet: true }).then(r => r.data),

  list: () => api.get(`${API_ROUTES.USER}/favourites`).then(r => r.data),

  add: (productId) =>
    api.post(`${API_ROUTES.USER}/favourites/${productId}`).then(r => r.data),

  remove: (productId) =>
    api.delete(`${API_ROUTES.USER}/favourites/${productId}`).then(() => productId),
}

export default favourites
