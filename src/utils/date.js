// Which locale formats a date in each of the site's three languages. Not the
// same as the language tag i18next uses: "es" alone does not say whether a
// date reads day-first or month-first, and Intl needs a country to know.
const LOCALE = {
  es: 'es-CO',
  en: 'en-US',
  pt: 'pt-BR',
}

/**
 * A date, in the reader's own language.
 *
 * The order date used to be hardcoded to es-CO regardless of which language
 * the page was showing — invisible while the site only had one language, and
 * wrong the moment a second one was chosen.
 */
export const formatDate = (value, language) =>
  new Date(value).toLocaleDateString(LOCALE[language] ?? LOCALE.es)
