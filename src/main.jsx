import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Self-hosted variable faces. Loaded before the stylesheet so the @theme
// declarations that name them resolve against fonts the browser already has.
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/instrument-sans'

import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
