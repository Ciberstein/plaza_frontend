import { createContext, use, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_LANGUAGE, LANGUAGES, STORAGE_KEY } from '../../i18n'

// What the switcher shows. Ordered with Spanish first for the same reason it
// is the default: it is the language most of the audience reads in.
const CATALOG = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
]

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  languages: CATALOG,
  setLanguage: () => {},
})

export const useLanguage = () => use(LanguageContext)

/**
 * The switch between the three languages the site is written in.
 *
 * `i18next` already holds the active language; this exists so a component can
 * read it without importing the library directly, and so changing it is one
 * call that keeps three things in step: the translations, `<html lang>` (which
 * screen readers and search engines read, not just this app), and the choice
 * remembered for next time.
 */
export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation()
  const [language, setLanguageState] = useState(i18n.language || DEFAULT_LANGUAGE)

  const setLanguage = useCallback((next) => {
    if (!LANGUAGES.includes(next) || next === i18n.language) return

    i18n.changeLanguage(next)
    localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.lang = next
    setLanguageState(next)
  }, [i18n])

  const value = useMemo(
    () => ({ language, languages: CATALOG, setLanguage }),
    [language, setLanguage],
  )

  return <LanguageContext value={value}>{children}</LanguageContext>
}
