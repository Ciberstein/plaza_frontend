import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Public } from '../components/layouts'
import Protected from '../components/shared/Protected'
import Access from '../components/pages/Access'
import Dashboard from '../components/pages/Dashboard'
import Home from '../components/pages/Home'
import Sell from '../components/pages/Sell'
import Shop from '../components/pages/Shop'

const router = createBrowserRouter([
  {
    element: <Public />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/c/:category', element: <Home /> },
      { path: '/s/:slug', element: <Shop /> },
      { path: '/access', element: <Access /> },
      { path: '/sell', element: <Protected><Sell /></Protected> },
      { path: '/dashboard', element: <Protected><Dashboard /></Protected> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default router
