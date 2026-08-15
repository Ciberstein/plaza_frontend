# Plaza — web

The shopfront for [plaza_backend](https://github.com/Ciberstein/plaza_backend).
A marketplace for Colombia where a listing belongs to a person, and a shop is
something you may be granted to trade under.

React 19, Vite, Tailwind v4, React Router.

---

## Running it

```bash
npm install
cp .env.example .env      # one variable, see below
npm run dev
```

```
npm run build    production bundle
npm run preview  serve the built bundle
npm run lint     eslint, including the React Compiler rules
```

The API has to be running and the origin this dev server uses has to be listed
in the backend's `CORS_ORIGINS`. The session is a httpOnly cookie, so a mismatch
shows up as everything behind a login failing with 401.

### The environment

```
VITE_API_URL=http://localhost:4000
```

Origin only, no path and no trailing slash. The `/api/v1` prefix lives in
`src/api/routes.js` because it is a fact about this codebase, not about where it
is deployed.

---

## How it is laid out

```
src/
  api/          the axios instance and the route prefixes
  context/      auth · meta · cart · favourites
  hooks/        useResource
  services/     one module per resource, the only place URLs appear
  utils/        money, avatars, the toast bridge
  components/
    ui/         the design system: Button, Input, Select, Accordion, …
    shared/     pieces used across pages: ProductCard, Contact, Toasts
    layouts/    the header, the footer, the page shell
    pages/      one folder per route
  index.css     every design token, and the handful of custom utilities
```

### The pages

```
/                 what is for sale
/servicios        the other aisle: people's work, not objects
/c/:category      either aisle, narrowed - a slug is unique across both
/p/:id            one listing
/shops            the directory of shops
/s/:slug          a shop and its catalogue
/access           sign in or create an account
/sell             selling on Plaza, and how to request a shop
/sell/shop        the shop request form            (session)
/cart                                              (session)
/saved                                             (session)
/purchases        what you bought, one card per seller   (session)
/sales            what you were asked to sell      (session)
/questions        what buyers asked you, waiting first    (session)
/listings         your own catalogue               (session)
/listings/new     and /listings/:id, the same editor    (session)
/dashboard        your shops                       (session)
/account          your settings                    (session)
```

---

## The design

Everything visual is in `src/index.css`. Colours, spacing, radii and the two
typefaces are CSS variables mapped into Tailwind's theme, so changing the brand
is changing that file and nothing else.

**Light only.** There is no `prefers-color-scheme` block. An earlier version
followed the operating system, which meant anyone on a dark-mode machine never
saw the palette at all. If a dark mode is ever wanted it should be a switch the
person chooses.

**Four colours, four jobs.** Blue is the brand and every action. Yellow says
something is waiting on you. Green means money saved or something that worked.
Red means it failed. Nothing else is coloured, so the shop marks and the
photographs are the only colour on a page of goods.

The neutrals carry a whisper of the brand hue rather than being plain grey. It
is the difference between a palette and a default.

**Type.** Bricolage Grotesque for signage — the wordmark, headings, prices — and
Instrument Sans for everything that has to be read. Both self-hosted through
Fontsource, so no request leaves for a font.

### Buttons

Two axes, not one. `variant` is how much ink it spends — `solid`, `soft`,
`outline`, `ghost` — and `color` is what it means — `primary`, `neutral`,
`success`, `danger`. They vary independently: a destructive action is sometimes
the loudest thing on screen and sometimes the quietest link in a row, and with a
single list the second one has no name.

```jsx
<Button.Action variant="ghost" color="danger">Delete</Button.Action>
<Button.Icon variant="overlay" color="danger" size="sm" aria-label="Remove" />
```

`Button.Icon` is always a perfect circle, including over a photograph.

---

## Conventions that are load-bearing

**Services own the URLs.** A component never builds one. Adding an endpoint
means adding a line to a service, and the shape of the API is readable in one
folder.

**`useResource(load, key)`** is how pages fetch. It derives `loading` from which
key produced the data, so nothing has to blank a list on the way to refetching
it — and there is no `setState` in the body of an effect, which the React
Compiler rules treat as an error rather than a warning.

**Failures surface by themselves.** The axios interceptor raises a toast for
every failed request, so a `catch {}` in a page is usually correct: the message
has already been shown, and often it is better than anything the page could say.
Pass `{ quiet: true }` for the handful of background requests where a toast
would be noise.

**The vocabulary comes from the API.** Categories, cities, countries, delivery
options and conditions are served by `/public/meta` and held in one context.
None of them is a constant in this repo, so none of them can drift.

**Contexts hold what the whole app asks for, not more.** The cart context holds
a count; the lines are the cart page's business. Favourites hold a Set of ids,
because the question every card asks is "is this one mine" and it asks it
forty-eight times a page.

---

### Questions on a listing

The listing page carries a count, not the questions. Quoting one onto the page
gives a single shopper's concern the same weight as the description; what the
section says instead is how many were asked and how many were answered, which
is what a buyer wants to know before bothering to type — a seller who answered
nine of nine is worth asking, and one who answered none of six has told you
something too. The questions themselves open in a dialog.

A question and its answer are one block, and whether it was answered is read
from the shape before any of the words: an answer hangs off its question on a
short accent rule, and an unanswered one has no rule but an `info` chip, which
is the colour that means "waiting" everywhere else on the site. Nobody is named
above a question — they are anonymous by design rather than by omission, so
nothing leaves a gap where an avatar would go.

`QuestionThread` and `AnswerForm` in `components/shared/Questions.jsx` are
shared with `/questions`, so the seller answers the same control in the dialog
on their own listing and in their inbox.

---

## Two things that are true and easy to get wrong

**A missing list is an empty list.** `MetaProvider` spreads the API response
over a complete set of empty arrays. It used to replace its state with the
response, so a key an older deployment did not send became `undefined` and took
down the first component that mapped over it.

**Optional chaining is not a safe comparison.** `a?.id === b?.id` is `true` when
neither exists, which once made every signed-out visitor the owner of every
listing. Guard the existence first.

---

## Language

Spanish, English and Portuguese, with Spanish the default — the audience is
Colombian, and the site should not open in a language someone has to switch
away from. `i18next` and `react-i18next`, flat JSON, one file per language:

```
i18n/
  index.js          resources, default language, localStorage key
  lang/es.json       lang/en.json       lang/pt.json
```

Every key is a dotted, PascalCase path scoped to where it is read —
`Header.Search.Placeholder`, `Editor.Availability.HintZero` — except for a
`Common.*` handful reused verbatim across pages: `Common.SellOnPlaza`,
`Common.BackToPlaza`. The three files are kept in lockstep on purpose; nothing
ships a key one language has and another does not.

`useLanguage()`, in `src/context/language.jsx`, is the switch: changing it
updates `i18next`, `<html lang>` (which a screen reader and a search engine
read, not only this app), and what is remembered for next time — one call,
three things kept in step. `useTranslation()` from `react-i18next` is how a
component reads a key.

**Two things translated do not mean everything does.** Condition, delivery
and shop-shipping are interface copy, not database content: `/public/meta`
sends only the raw value for those three, and `src/utils/vocabulary.js` turns
each one into a translated label and subtitle, the same way `CONDITION_KEY`
already did for a listing's displayed condition. Category names *are*
database content — seeded in Spanish, no admin flow yet to add one outside
the seeder — but small and fixed enough that `src/utils/categoryLabels.js`
is a plain lookup table, keyed by the same `slug` the API sends, rather than
a schema change; `withCategoryLabels()` applies it wherever a category name
is shown. City names are database content too, and are deliberately left as
the API sends them: they are proper nouns — *Bogotá*, not "Bogotá" translated
into anything — so following the active language would be wrong here rather
than merely incomplete, the same way a place name does not get typeset
differently in a book depending on what language you read it in. And
`formatMoney` (`src/utils/money.js`) always renders in `es-CO`, deliberately:
the currency is Colombian pesos regardless of who is reading, the same way a
menu priced in euros keeps its comma decimal for a visitor who reads no
French. `formatDate` (`src/utils/date.js`), by contrast, follows the active
language — a date carries no regional identity of its own, and showing one in
Spanish format to an English reader was a plain oversight, not a choice.

---

## Known gaps

- **No tests.** Verification is `npm run build`, `npm run lint`, and walking it.
- **No shop editing screen.** The API can upload and remove a shop logo; nothing
  in here calls it, because the only shop form is the one that requests one.
- **Nothing is paid through Plaza.** The cart and orders exist; there is no
  checkout, by design for now.
- **Server messages are not translated.** A failed request often surfaces the
  backend's own error text, which is English regardless of the page's language.
  Only the frontend's own fallback messages follow it.
- **A category added outside `categories.data.seeders.js`'s current 99 rows
  has no translation until `categoryLabels.js` is updated to match** — it
  shows its Spanish name in every language until then. See "Language" above.
