import { RouterProvider } from 'react-router-dom'
import Toasts from './components/shared/Toasts'
import { AuthProvider } from './context/auth'
import { LanguageProvider } from './context/language'
import { CartProvider } from './context/cart'
import { FavouritesProvider } from './context/favourites'
import { MetaProvider } from './context/meta'
import router from './routes'

// Toasts sit outside the router: a failed request during a route change still
// has to be able to say so.
const App = () => (
  <LanguageProvider>
    <AuthProvider>
      <MetaProvider>
        <CartProvider>
          <FavouritesProvider>
            <RouterProvider router={router} />
            <Toasts />
          </FavouritesProvider>
        </CartProvider>
      </MetaProvider>
    </AuthProvider>
  </LanguageProvider>
)

export default App
