import api from '../api/axios'
import { API_ROUTES } from '../api/routes'

const orders = {
  // What I bought.
  mine: () => api.get(`${API_ROUTES.USER}/orders`).then(r => r.data),
  read: (id) => api.get(`${API_ROUTES.USER}/orders/${id}`).then(r => r.data),

  // The basket carries ids and counts and nothing else. Prices are the
  // server's to read; sending them would be asking it to trust the browser
  // about what things cost.
  place: (items) => api.post(`${API_ROUTES.USER}/orders`, { items }).then(r => r.data),

  // One seller's part of an order, not the whole thing.
  cancelPart: (id, subOrderId, reason) =>
    api
      .post(`${API_ROUTES.USER}/orders/${id}/parts/${subOrderId}/cancel`, { reason })
      .then(r => r.data),

  // The buyer's own way to close a part. Until this existed only the seller
  // could, which made them the keeper of the door that ratings open behind.
  markReceived: (id, subOrderId) =>
    api
      .post(`${API_ROUTES.USER}/orders/${id}/parts/${subOrderId}/received`)
      .then(r => r.data),

  // What I have been asked to sell. Addressed by suborder, which is the unit
  // a seller actually deals with.
  sales: () => api.get(`${API_ROUTES.USER}/sales`).then(r => r.data),
  confirm: (id) => api.post(`${API_ROUTES.USER}/sales/${id}/confirm`).then(r => r.data),
  deliver: (id) => api.post(`${API_ROUTES.USER}/sales/${id}/deliver`).then(r => r.data),
  cancelSale: (id, reason) =>
    api.post(`${API_ROUTES.USER}/sales/${id}/cancel`, { reason }).then(r => r.data),
}

export default orders
