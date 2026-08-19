import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MAP_STYLE, accent, loadMaps, mapsAvailable } from '../../utils/googleMaps'

// A coordinate, or NaN. Not `Number()` alone: `Number(null)` is 0 and
// `Number('')` is 0, both of which are perfectly finite numbers off the coast
// of Ghana — so a property nobody has placed would pass a plain isFinite check
// and draw an empty grey box where a map should be.
const coord = (value) =>
  value === null || value === undefined || value === '' ? NaN : Number(value)

/**
 * Where the property is, as much as its owner chose to say.
 *
 * Two states, and the server decides which: a pin on the address, or a circle
 * with no pin at all. `blurred` says which arrived, and the coordinate that
 * came with it is already displaced — the browser never holds the real one for
 * a listing whose owner did not publish the address.
 *
 * Drawing a circle around a point the browser was told is exact would be the
 * same mistake wearing a different hat, which is why the displacement is not
 * done here.
 */
const PropertyMap = ({ property, title }) => {
  const { t } = useTranslation()
  const box = useRef(null)
  const [failed, setFailed] = useState(false)

  const { latitude, longitude, blurred, radius } = property ?? {}
  const placed = Number.isFinite(coord(latitude)) && Number.isFinite(coord(longitude))

  useEffect(() => {
    if (!placed || !mapsAvailable) return

    let ignore = false

    loadMaps()
      .then((maps) => {
        if (ignore || !box.current) return

        const centre = { lat: Number(latitude), lng: Number(longitude) }

        const map = new maps.Map(box.current, {
          center: centre,
          // Close enough to read the streets when the address is exact, and
          // deliberately further out when it is not: a blurred point at street
          // zoom invites somebody to squint at the doors inside the circle.
          zoom: blurred ? 15 : 17,
          styles: MAP_STYLE,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          // A map inside a scrolling page must not eat the scroll. Ctrl-drag
          // or two fingers zooms it; a wheel over it moves the page, which is
          // what somebody reading the page meant.
          gestureHandling: 'cooperative',
        })

        if (blurred) {
          new maps.Circle({
            map,
            center: centre,
            radius: Number(radius) || 400,
            strokeColor: accent(),
            strokeOpacity: 0.5,
            strokeWeight: 2,
            fillColor: accent(),
            fillOpacity: 0.12,
          })
        } else {
          // The classic Marker rather than AdvancedMarkerElement: the newer one
          // needs a cloud-configured Map ID, which is a second setup step for a
          // pin that looks the same.
          new maps.Marker({ map, position: centre, title })
        }
      })
      .catch(() => { if (!ignore) setFailed(true) })

    return () => { ignore = true }
  }, [placed, latitude, longitude, blurred, radius, title])

  // Nothing to place, no key configured, or the script would not load. All
  // three are the same thing to a reader — there is no map — and the section
  // above still says the neighbourhood and the city in words.
  if (!placed || !mapsAvailable || failed) return null

  return (
    <div className="mt-3 overflow-hidden rounded-pz border border-line">
      <div ref={box} className="h-64 w-full bg-sunk sm:h-80" />

      {blurred && (
        <p className="border-t border-line bg-sunk px-3 py-2 text-xs leading-relaxed text-muted">
          {t('Property.Location.Approximate')}
        </p>
      )}
    </div>
  )
}

export default PropertyMap
