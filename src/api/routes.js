// VITE_API_URL carries only the origin, so the API prefix lives here rather
// than in the environment: it is a fact about this codebase, not about where it
// is deployed, and burying it in a variable means every environment has to
// repeat it correctly.
const API_BASE = '/api/v1';

export const API_ROUTES = {
  AUTH: `${API_BASE}/auth`,
  PUBLIC: `${API_BASE}/public`,
  USER: `${API_BASE}/user`,
  ADMIN: `${API_BASE}/admin`,
};
