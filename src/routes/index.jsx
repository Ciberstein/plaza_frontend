import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Public } from '../components/layouts'
import Protected from '../components/shared/Protected'
import Access from '../components/pages/Access'
import Account from '../components/pages/Account'
import Dashboard from '../components/pages/Dashboard'
import Home from '../components/pages/Home'
import Listings from '../components/pages/Listings'
import ListingEditor from '../components/pages/Listings/Editor'
import Sell from '../components/pages/Sell'
import ShopRequest from '../components/pages/Sell/ShopRequest'
import Product from '../components/pages/Product'
import Shop from '../components/pages/Shop'
import Shops from '../components/pages/Shops'

const router = createBrowserRouter([
  {
    element: <Public />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/c/:category', element: <Home /> },
      { path: '/p/:id', element: <Product /> },
      // The directory the home page used to be. Reached on purpose now.
      { path: '/shops', element: <Shops /> },
      { path: '/s/:slug', element: <Shop /> },
      { path: '/access', element: <Access /> },
      { path: '/account', element: <Protected><Account /></Protected> },
      // Public on purpose: its main call to action for a signed-out visitor is
      // to create an account, which a guard would make unreachable.
      { path: '/sell', element: <Sell /> },
      { path: '/sell/shop', element: <Protected><ShopRequest /></Protected> },
      { path: '/dashboard', element: <Protected><Dashboard /></Protected> },
      { path: '/listings', element: <Protected><Listings /></Protected> },
      // One component for both: creating saves first and lands on the edit
      // screen, because photos cannot attach to a row that does not exist.
      { path: '/listings/new', element: <Protected><ListingEditor /></Protected> },
      { path: '/listings/:id', element: <Protected><ListingEditor /></Protected> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default router
