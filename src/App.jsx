import { RouterProvider } from 'react-router-dom'
import Toasts from './components/shared/Toasts'
import { AuthProvider } from './context/auth'
import { MetaProvider } from './context/meta'
import router from './routes'

// Toasts sit outside the router: a failed request during a route change still
// has to be able to say so.
const App = () => (
  <AuthProvider>
    <MetaProvider>
      <RouterProvider router={router} />
      <Toasts />
    </MetaProvider>
  </AuthProvider>
)

export default App
