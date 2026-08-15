/**
 * Renders the star control on the server to prove it runs.
 *
 * A build that succeeds only proves the imports resolve. This mounts the thing
 * and reads the markup back, which is what catches a component that throws on
 * first render, a translation key that never landed, and — the reason it was
 * written — whether the partial fill a fractional average relies on actually
 * appears.
 *
 * Loaded through Vite rather than by Node directly, because Node does not
 * transform JSX and the point is to test the real file rather than a copy of
 * it kept in a language Node happens to read.
 *
 * Run with: node scripts/smoke-stars.mjs
 */
import { createServer } from 'vite'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement as h } from 'react'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'

// The i18n module reads the remembered language at import time, which is
// right for a browser app and absent here. Stubbed rather than worked around,
// so the real module is the one under test.
globalThis.localStorage ??= {
  store: new Map(),
  getItem(k) { return this.store.get(k) ?? null },
  setItem(k, v) { this.store.set(k, String(v)) },
  removeItem(k) { this.store.delete(k) },
}
// MUI's styled engine looks for a style container the moment it is imported,
// so this needs slightly more than an empty object. Nothing here is exercised
// by the assertions below; it exists so the import does not throw before the
// component under test gets a chance to render.
globalThis.document ??= {
  documentElement: {},
  head: {},
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ setAttribute() {}, appendChild() {}, style: {} }),
  createTextNode: () => ({}),
}

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

const { default: i18n } = await vite.ssrLoadModule('/i18n/index.js')
const { Score, Picker } = await vite.ssrLoadModule('/src/components/ui/Stars.jsx')

await i18n.changeLanguage('es')

// Emotion builds its style cache from the document when it is first used,
// which there is not one of here. This is the cache MUI's own server-side
// guidance prescribes, and wrapping every render in it is what lets the real
// component be tested rather than a stand-in.
const cache = createCache({ key: 'pz', prepend: true })
const render = (element) => renderToStaticMarkup(h(CacheProvider, { value: cache }, element))

let failures = 0

const check = (label, ok, detail = '') => {
  if (!ok) failures += 1
  console.log(
    `${ok ? '\x1b[32mPASA \x1b[0m' : '\x1b[31mFALLA\x1b[0m'} ${label}${detail ? ' -> ' + detail : ''}`,
  )
}

const has = (markup, ...parts) => parts.every(p => markup.includes(p))

/* ── a rating already left, with a fraction ─────────────────────────────── */
const score = render(h(Score, { average: 4.3, count: 12 }))

check('Score dibuja estrellas', has(score, 'MuiRating-root'))
// Behaviour, not a class name: the point of read-only is that there is
// nothing to click, and the first attempt at this asserted a class MUI does
// not emit while the component was fine.
check('Score no ofrece nada que elegir', !score.includes('type="radio"'))
check('Score se etiqueta una sola vez y en espanol',
  score.includes('4.3 de 5 estrellas') && !score.includes('Stars"'))
// The clipped overlay MUI uses for a partially filled star. Its presence is
// the whole reason showing a fractional average is worth anything.
check('Score rellena la estrella parcial', has(score, 'MuiRating-decimal'))
check('Score imprime el promedio', has(score, '4.3'))
check('Score cuenta en espanol', has(score, '12 calificaciones'))
check('Score usa los iconos de Plaza', has(score, 'text-info', 'text-line-strong'))

/* ── nobody has rated it ────────────────────────────────────────────────── */
const empty = render(h(Score, { average: null, count: 0 }))

check('Sin calificaciones lo dice', has(empty, 'Sin calificaciones'))
check('Sin calificaciones no dibuja cinco vacias', !empty.includes('MuiRating-root'))

/* ── choosing one ───────────────────────────────────────────────────────── */
const picker = render(h(Picker, { value: 3, onChange: () => {} }))
const radios = (picker.match(/type="radio"/g) ?? []).length

// The reason this library is here at all: one control with five options, not
// five buttons somebody has to infer an order from.
check('Picker es un grupo de radios', has(picker, 'type="radio"'), `${radios} radios`)
check('Picker ofrece las cinco opciones', radios >= 5)
check('Picker marca la elegida', has(picker, 'checked'))
check('Picker etiqueta cada opcion en espanol', has(picker, 'Dar 3 de 5 estrellas'))
check('Picker no es de solo lectura', !picker.includes('MuiRating-readOnly'))

await vite.close()

console.log(failures ? `\n\x1b[31m${failures} fallos\x1b[0m` : '\n\x1b[32mtodo bien\x1b[0m')
process.exit(failures ? 1 : 0)
