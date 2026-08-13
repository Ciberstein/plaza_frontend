import { useEffect, useState } from 'react'

/**
 * Loads something whenever `key` changes.
 *
 * Two things this does that a plain effect does not:
 *
 * The ignore flag is not ceremony. Clicking two categories quickly starts two
 * requests, and the first can answer last — without it the grid ends up showing
 * the category the person already navigated away from.
 *
 * `loading` is derived from which key produced the data rather than stored in
 * its own state. A stored flag has to be raised synchronously at the top of the
 * effect, which costs an extra render on every fetch and is exactly what
 * react-hooks flags.
 *
 * @param load  a function returning a promise; make it a useCallback
 * @param key   a string identifying the request, compared to decide loading
 */
export const useResource = (load, key) => {
  const [result, setResult] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    let ignore = false

    load()
      .then(data => { if (!ignore) setResult({ key, data, error: null }) })
      .catch(error => { if (!ignore) setResult({ key, data: null, error }) })

    return () => { ignore = true }
  }, [load, key])

  return {
    data: result.data,
    error: result.error,
    loading: result.key !== key,
  }
}
