import api from '../api/axios'
import { API_ROUTES } from '../api/routes'

const account = {
  me: () => api.get(API_ROUTES.USER + '/account').then(r => r.data),

  updateProfile: (payload) =>
    api.patch(API_ROUTES.USER + '/account', payload).then(r => r.data),

  // Two steps: the code goes to the address being claimed, and only the second
  // call moves the account.
  requestEmailChange: (payload) =>
    api.post(API_ROUTES.USER + '/account/email', payload).then(r => r.data),
  confirmEmailChange: (payload) =>
    api.post(API_ROUTES.USER + '/account/email/confirm', payload).then(r => r.data),

  updatePassword: (payload) =>
    api.patch(API_ROUTES.USER + '/account/password', payload).then(r => r.data),

  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('image', file)
    // No Content-Type set by hand: the browser has to add the multipart
    // boundary, and naming the header strips it.
    return api.post(API_ROUTES.USER + '/account/avatar', form).then(r => r.data)
  },
  deleteAvatar: () =>
    api.delete(API_ROUTES.USER + '/account/avatar').then(r => r.data),

  verify: (code) => api.post(API_ROUTES.AUTH + '/verify', { code }).then(r => r.data),
  resendVerification: () =>
    api.post(API_ROUTES.AUTH + '/verify/resend').then(r => r.data),
}

export default account
