import api from '../api/axios'
import { API_ROUTES } from '../api/routes'

/**
 * Who works in a shop, and the invitations that put them there.
 *
 * Two groups on the server for a reason worth keeping in mind here: the roster
 * hangs off a shop, and invitations do not. Until you accept one, the shop is
 * not yours to look inside — so "what am I being asked to join" cannot be a
 * question about a shop you cannot yet read.
 */
const members = {
  // The roster. Readable by anybody who works there; `owned` on the response
  // says whether the person asking may invite and remove.
  list: (shopId) => api.get(`${API_ROUTES.USER}/shops/${shopId}/members`).then(r => r.data),

  // By username or email — an owner knows one or the other and rarely both.
  invite: (shopId, handle) =>
    api.post(`${API_ROUTES.USER}/shops/${shopId}/members`, { handle }).then(r => r.data),

  // Removing somebody, or leaving. The same call: it is the same row going
  // away, and the server decides which of the two you are allowed to do.
  remove: (shopId, accountId) =>
    api.delete(`${API_ROUTES.USER}/shops/${shopId}/members/${accountId}`).then(() => accountId),

  // Quiet: it runs on every page load to light the badge, and a failure means
  // one missing badge rather than anything worth a toast.
  invitations: () => api.get(`${API_ROUTES.USER}/invitations`, { quiet: true }).then(r => r.data),

  accept: (id) => api.post(`${API_ROUTES.USER}/invitations/${id}/accept`).then(r => r.data),
  decline: (id) => api.post(`${API_ROUTES.USER}/invitations/${id}/decline`).then(() => id),
}

export default members
