import api from '../api/axios'
import { API_ROUTES } from '../api/routes'

export const MESSAGE_MAX = 500

/**
 * Asking to see a property, and answering.
 *
 * This is what a property has instead of an order. Nothing here is a purchase:
 * the request opens a conversation, and accepting it is what hands each side
 * the other's phone, email and the full address — which the server decides, so
 * nothing in this file has to be trusted with it.
 */
const visits = {
  // What I asked to see.
  mine: () => api.get(`${API_ROUTES.USER}/visits`).then(r => r.data),

  // What I have been asked to show. Two lists rather than one: somebody who
  // both rents out a flat and is looking for one is not helped by a screen
  // that mixes the two.
  received: () => api.get(`${API_ROUTES.USER}/visits/received`).then(r => r.data),

  request: (productId, message, preferredAt = null) =>
    api.post(`${API_ROUTES.USER}/visits`, { productId, message, preferredAt }).then(r => r.data),

  accept: (id) => api.post(`${API_ROUTES.USER}/visits/${id}/accept`).then(r => r.data),
  decline: (id) => api.post(`${API_ROUTES.USER}/visits/${id}/decline`).then(r => r.data),
}

export default visits
