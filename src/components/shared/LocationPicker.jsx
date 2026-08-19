import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { Button } from '../ui'
import { MAP_STYLE, loadMaps, mapsAvailable } from '../../utils/googleMaps'

// Where the map opens when there is nothing to open it on. Bogotá, because a
// map of the Atlantic is a worse first impression than a map of the wrong
// Colombian city.
const COLOMBIA = { lat: 4.711, lng: -74.0721 }

// A coordinate, or NaN. Not `Number()` alone: `Number(null)` is 0 and
// `Number('')` is 0, both of which are perfectly finite numbers off the coast
// of Ghana — so a property nobody has placed would pass a plain isFinite check
// and draw an empty grey box where a map should be.
const coord = (value) =>
  value === null || value === undefined || value === '' ? NaN : Number(value)

/**
 * Putting the property on the map.
 *
 * Geocoding the address gets it roughly right and the pin gets it exactly
 * right, and both are needed. Colombian addresses — "Calle 45 # 12-34, apto
 * 302" — geocode to the block rather than the building, and no geocoder knows
 * which of the four towers in a conjunto is the one. Idealista solves this the
 * same way: it looks the address up, then says grab the pin and drag it.
 *
 * Nothing is geocoded while somebody types. It happens when they ask, on a
 * button, because a geocode per keystroke is a billed call per keystroke.
 */
const LocationPicker = ({ address, city, value, onChange }) => {
  const { t } = useTranslation()
  const box = useRef(null)
  const map = useRef(null)
  const marker = useRef(null)
  const geocoder = useRef(null)

  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  // Two different failures that used to share one flag, which made the form
  // say "we could not find that address" when it had never looked — the
  // script itself had been blocked before the geocoder existed.
  const [blocked, setBlocked] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const placed = Number.isFinite(coord(value?.latitude)) && Number.isFinite(coord(value?.longitude))

  useEffect(() => {
    if (!mapsAvailable) return

    let ignore = false

    loadMaps()
      .then((maps) => {
        if (ignore || !box.current) return

        const start = placed
          ? { lat: Number(value.latitude), lng: Number(value.longitude) }
          : COLOMBIA

        map.current = new maps.Map(box.current, {
          center: start,
          zoom: placed ? 17 : 11,
          styles: MAP_STYLE,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'cooperative',
        })

        geocoder.current = new maps.Geocoder()

        marker.current = new maps.Marker({
          map: map.current,
          position: start,
          draggable: true,
          // Absent until there is something to mark. A pin sitting on the
          // middle of Bogotá by default is a coordinate somebody will save
          // without noticing it was never theirs.
          visible: placed,
        })

        // The pin is the authority. Whatever the geocoder said, this is where
        // the owner says it is.
        marker.current.addListener('dragend', (event) => {
          onChange({
            latitude: Number(event.latLng.lat().toFixed(6)),
            longitude: Number(event.latLng.lng().toFixed(6)),
          })
        })

        // Clicking places it too, which is faster than dragging from the
        // middle of the country the first time.
        map.current.addListener('click', (event) => {
          marker.current.setPosition(event.latLng)
          marker.current.setVisible(true)
          onChange({
            latitude: Number(event.latLng.lat().toFixed(6)),
            longitude: Number(event.latLng.lng().toFixed(6)),
          })
        })

        setReady(true)
      })
      .catch(() => { if (!ignore) setBlocked(true) })

    return () => { ignore = true }
    // Deliberately once: this builds the map, and rebuilding it on every
    // coordinate change would throw away the pan and zoom the seller just did.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The map follows the form when the coordinate changes from outside — the
  // geocode button, or a listing loading into the editor — without being
  // rebuilt.
  useEffect(() => {
    if (!ready || !placed) return

    const point = { lat: Number(value.latitude), lng: Number(value.longitude) }
    marker.current.setPosition(point)
    marker.current.setVisible(true)
    map.current.panTo(point)
  }, [ready, placed, value?.latitude, value?.longitude])

  const locate = () => {
    if (!geocoder.current || !address?.trim()) return

    setBusy(true)

    // The city is appended because "Calle 45 # 12-34" exists in every
    // Colombian town, and the geocoder will happily pick one of them.
    const query = [address, city, 'Colombia'].filter(Boolean).join(', ')

    geocoder.current.geocode({ address: query }, (results, status) => {
      setBusy(false)

      if (status !== 'OK' || !results?.[0]) return setNotFound(true)

      setNotFound(false)
      const point = results[0].geometry.location
      map.current.setZoom(17)
      onChange({
        latitude: Number(point.lat().toFixed(6)),
        longitude: Number(point.lng().toFixed(6)),
      })
    })
  }

  if (!mapsAvailable) return null

  if (blocked) {
    return (
      <p className="rounded-pz border border-line border-l-[3px] border-l-info bg-sunk px-4 py-3 text-sm leading-relaxed text-muted">
        {t('Editor.Map.Blocked')}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-ink">{t('Editor.Map.Label')}</span>

        <Button.Action
          type="button"
          variant="outline"
          color="neutral"
          size="sm"
          loading={busy}
          disabled={!address?.trim() || !ready}
          onClick={locate}
        >
          <MapPinIcon className="size-4" />
          {t('Editor.Map.Locate')}
        </Button.Action>
      </div>

      <p className="text-xs leading-relaxed text-muted">
        {placed ? t('Editor.Map.Hint') : t('Editor.Map.HintEmpty')}
      </p>

      <div className="overflow-hidden rounded-pz border border-line">
        <div ref={box} className="h-64 w-full bg-sunk" />
      </div>

      {notFound && (
        <p className="text-xs text-alert">{t('Editor.Map.NotFound')}</p>
      )}
    </div>
  )
}

export default LocationPicker
