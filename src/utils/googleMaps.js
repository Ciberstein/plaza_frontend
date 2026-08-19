/**
 * Loads the Google Maps script, once, on demand.
 *
 * On demand because it is a third-party script of a few hundred kilobytes that
 * only two screens in the whole app need — the property page and the property
 * half of the editor. Loading it in `index.html` would make everyone who
 * bought a shirt pay for a map they never saw.
 *
 * Once because the API refuses to be loaded twice and says so in the console
 * rather than by throwing, which is a failure that is easy to ship. The
 * promise is cached at module scope, so ten components asking at the same
 * moment produce one script tag and ten resolutions of the same promise.
 */

// Public by design — a browser has to send it — which is why it must be
// restricted by HTTP referrer in the Google Cloud console. Unrestricted, it is
// a key anybody can lift out of the bundle and spend against your account.
const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

/**
 * Whether there is a map to show at all.
 *
 * Read before rendering anything, because an app with no key configured has to
 * stay usable: the property page still says where the place is in words, and
 * the editor still takes an address. A missing key is a missing map, never a
 * broken screen.
 */
export const mapsAvailable = Boolean(KEY)

/**
 * Whether the drawing tool made it.
 *
 * Asked separately because it is the one piece that can be missing while the
 * map itself is fine, and a search that cannot draw a zone is still a search.
 */
export const canDraw = () => Boolean(window.google?.maps?.drawing?.DrawingManager)

let pending = null

export const loadMaps = () => {
  if (!KEY) return Promise.reject(new Error('No Google Maps key configured'))
  if (pending) return pending

  pending = new Promise((resolve, reject) => {
    // `?.Map` and not just `?.maps`. With `loading=async` the API installs a
    // partially built `google.maps` well before it is usable, so testing the
    // namespace answers yes while `new maps.Map(...)` still throws "is not a
    // constructor". A class that has to exist is the honest test.
    if (window.google?.maps?.Map) return resolve(window.google.maps)

    // The callback is the signal, and this is the whole bug that took four
    // attempts to find.
    //
    // A script tag's `load` event fires when the *file* has run, which under
    // `loading=async` is long before the API has finished assembling itself.
    // Resolving there hands callers a `google.maps` whose classes do not exist
    // yet — and the failure surfaces as a TypeError deep inside a component,
    // pointing at everything except the loader that caused it.
    //
    // Google documents `callback` for exactly this. It fires when the API is
    // genuinely ready.
    const READY = '__plazaMapsReady'

    window[READY] = async () => {
      const maps = window.google.maps

      // The newer inline bootstrap fetches libraries on demand and provides
      // this; the classic loader populates them from `libraries=` and does
      // not. Used when present, ignored when not — requiring it was an
      // earlier wrong turn that rejected a perfectly loaded script.
      if (maps.importLibrary) {
        // allSettled, not all: a library that will not come must not take the
        // map with it. A map without the drawing tool beats no map.
        await Promise.allSettled([
          maps.importLibrary('maps'),
          maps.importLibrary('marker'),
          maps.importLibrary('drawing'),
          maps.importLibrary('geocoding'),
        ])
      }

      delete window[READY]
      resolve(maps)
    }

    const script = document.createElement('script')
    // `language` and `region` make the labels and the geocoder's idea of an
    // address Colombian, which matters for a country whose addresses read
    // "Calle 45 # 12-34".
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${KEY}` +
      `&libraries=marker,drawing&language=es&region=CO&loading=async&callback=${READY}`
    script.async = true

    script.addEventListener('error', () => {
      // Cleared so a later attempt retries rather than being handed the
      // rejected promise from the first one forever.
      pending = null
      delete window[READY]
      reject(new Error('Google Maps failed to load'))
    })

    document.head.appendChild(script)
  })

  return pending
}

/**
 * Plaza's map, rather than Google's.
 *
 * The default styling is a road atlas: motorway shields, petrol stations,
 * every business in the neighbourhood competing with the one pin that matters.
 * This turns off the points of interest and the transit layer and leaves the
 * streets and the water, which is what somebody placing a flat actually reads.
 */
export const MAP_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
]

// The accent, so a pin and a circle belong to the same palette as everything
// else on the page. Read from the token rather than repeated as a literal —
// the palette has moved once already.
export const accent = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--pz-accent').trim() || '#254c93'
