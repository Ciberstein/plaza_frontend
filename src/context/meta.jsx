import { createContext, use, useEffect, useState } from 'react'
import meta from '../services/meta.services'

/**
 * Every list the API can serve, empty.
 *
 * Declared once and spread under the response rather than trusted to arrive:
 * the answer replaces this object wholesale, so a key the server does not send
 * — an older deployment, a field added this week, a partial response — used to
 * become `undefined` and take down the first component that mapped over it.
 *
 * A missing list is an empty list. That is a true statement in every one of
 * those cases, and it is the difference between a form that renders without
 * options and a page that will not render at all.
 */
const EMPTY = {
  categories: [],
  countries: [],
  cities: [],
  shipping: [],
  conditions: [],
  delivery: [],
  rateUnits: [],
  serviceDelivery: [],
  // The property vocabulary. `regions` is the one that is not an enum: it is
  // derived from the cities, because a department is a column on them rather
  // than a table of its own.
  operations: [],
  propertyConditions: [],
  features: [],
  addressVisibility: [],
  strata: [],
  regions: [],
  // Present only in development, where the API sends the guest account so the
  // login screen can print it. Null everywhere else, which is what the login
  // screen checks — it never decides this for itself.
  demo: null,
}

const MetaContext = createContext({ ...EMPTY, ready: false })

export const useMeta = () => use(MetaContext)

// Fetched once for the whole app. Categories and cities are read by the header,
// the browse filters and every seller form, and each of those asking for its
// own copy would be four identical requests on one page load.
export const MetaProvider = ({ children }) => {
  const [value, setValue] = useState({ ...EMPTY, ready: false })

  useEffect(() => {
    meta
      .index()
      .then(data => setValue({ ...EMPTY, ...data, ready: true }))
      .catch(() => setValue({ ...EMPTY, ready: true }))
  }, [])

  return <MetaContext value={value}>{children}</MetaContext>
}
