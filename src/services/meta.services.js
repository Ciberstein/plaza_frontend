import api from '../api/axios'
import { API_ROUTES } from '../api/routes'

// Categories, cities and delivery options come from the API so the forms and
// the server validate against the same list.
const meta = {
  index: () => api.get(`${API_ROUTES.PUBLIC}/meta`).then(r => r.data),
}

export default meta
