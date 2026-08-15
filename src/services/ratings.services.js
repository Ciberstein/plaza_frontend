import api from '../api/axios'
import { API_ROUTES } from '../api/routes'

export const MAX_STARS = 5
export const COMMENT_MAX = 1000

const ratings = {
  // Public: what people who bought it thought. The averages themselves ride on
  // the listing, so nothing has to ask twice to draw a card.
  onProduct: (productId) =>
    api.get(`${API_ROUTES.PUBLIC}/products/${productId}/reviews`).then(r => r.data),

  // Two judgements, two calls. One is about how a person behaved and the other
  // about whether a thing is any good, and neither is a special case of the
  // other.
  rateSeller: (subOrderId, stars, comment) =>
    api.post(`${API_ROUTES.USER}/ratings/seller`, { subOrderId, stars, comment }).then(r => r.data),

  reviewProduct: (productId, stars, body) =>
    api.post(`${API_ROUTES.USER}/ratings/product`, { productId, stars, body }).then(r => r.data),

  // What this person has already said, so the purchases screen knows which
  // cards still need a button. Quiet: it is background, and a failure means one
  // button too many rather than anything worth a toast.
  mine: () => api.get(`${API_ROUTES.USER}/ratings/mine`, { quiet: true }).then(r => r.data),
}

export default ratings
