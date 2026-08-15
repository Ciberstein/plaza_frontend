import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Initialised for its side effect: it configures i18next before anything
// tries to translate. Imported ahead of the fonts and the stylesheet so the
// language is settled before the first paint rather than flashing the
// default and then swapping.
import i18n from '../i18n'

// The static lang="es-CO" in index.html is the best guess before any script
// has run. Once i18next has resolved the real answer — the stored choice, or
// the default — the document is corrected to match, so a screen reader or a
// search engine never reads a language the page is not actually in.
document.documentElement.lang = i18n.language

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
