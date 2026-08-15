import api from '../api/axios'
import { API_ROUTES } from '../api/routes'

// What the server accepts, stated here so the form can say "40 left" instead
// of letting someone write six hundred characters and then refusing them.
export const QUESTION_MAX = 500
export const ANSWER_MAX = 1000

const questions = {
  // Public: the answers are part of what the listing tells you, so reading
  // them needs no session.
  onProduct: (productId) =>
    api.get(`${API_ROUTES.PUBLIC}/products/${productId}/questions`).then(r => r.data),

  // Asking and answering are both "a question I am involved in", so both live
  // under the same resource rather than one hanging off the listing.
  ask: (productId, body) =>
    api.post(`${API_ROUTES.USER}/questions`, { productId, body }).then(r => r.data),

  inbox: () => api.get(`${API_ROUTES.USER}/questions`).then(r => r.data),

  answer: (id, answer) =>
    api.post(`${API_ROUTES.USER}/questions/${id}/answer`, { answer }).then(r => r.data),
}

export default questions
