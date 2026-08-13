import { createContext, use, useEffect, useState } from 'react'
import meta from '../services/meta.services'

const MetaContext = createContext({ categories: [], cities: [], shipping: [], ready: false })

export const useMeta = () => use(MetaContext)

// Fetched once for the whole app. Categories and cities are read by the header
// strip, the browse filters and every seller form, and each of those asking for
// its own copy would be four identical requests on one page load.
export const MetaProvider = ({ children }) => {
  const [value, setValue] = useState({ categories: [], cities: [], shipping: [], ready: false })

  useEffect(() => {
    meta
      .index()
      .then(data => setValue({ ...data, ready: true }))
      .catch(() => setValue(v => ({ ...v, ready: true })))
  }, [])

  return <MetaContext value={value}>{children}</MetaContext>
}
