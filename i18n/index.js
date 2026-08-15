import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'

import es from './lang/es.json'
import en from './lang/en.json'
import pt from './lang/pt.json'

// Spanish first, because the audience is Colombian and the site should not
// open in a language the person has to switch away from. English and
// Portuguese exist for the rest of the region; nothing else is planned yet, so
// nothing else is wired in.
export const LANGUAGES = ['es', 'en', 'pt']
export const DEFAULT_LANGUAGE = 'es'
const STORAGE_KEY = 'plaza.lang'

// Read once, before the app renders, so the first paint is already in the
// right language rather than flashing the default and then swapping.
const stored = localStorage.getItem(STORAGE_KEY)
const initial = LANGUAGES.includes(stored) ? stored : DEFAULT_LANGUAGE

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
    pt: { translation: pt },
  },

  lng: initial,
  fallbackLng: DEFAULT_LANGUAGE,

  // React already escapes everything it renders, so a second pass here would
  // only stop legitimate HTML entities like the apostrophe in "you're" from
  // resolving.
  interpolation: {
    escapeValue: false,
  },
})

export { STORAGE_KEY }
export default i18n
