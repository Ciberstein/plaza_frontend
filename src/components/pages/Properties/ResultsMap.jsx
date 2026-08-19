import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MagnifyingGlassIcon, PencilIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { Button } from '../../ui'
import { MAP_STYLE, accent, canDraw, loadMaps, mapsAvailable } from '../../../utils/googleMaps'
import { formatMoney } from '../../../utils/money'

// Where to open when there is nothing to fit to. Colombia, wide enough that
// somebody with no results at all sees the country rather than the ocean.
const COLOMBIA = { center: { lat: 4.6, lng: -74.1 }, zoom: 6 }

// How far the first fit is allowed to zoom in. One result would otherwise put
// the map on a rooftop, which is a strange place to start a search from — and
// on a blurred listing it is a rooftop that is not even the right one.
const MAX_FIT_ZOOM = 15

/**
 * The results, as a map you can search by moving.
 *
 * Two ways to name an area, and they are different questions. Panning asks
 * "what is in front of me" and is answered by the map's own bounds; drawing
 * asks "what is in *this* shape", which is the one somebody reaches for when
 * the area they want is a neighbourhood and not a rectangle — the river on one
 * side, the avenue on the other.
 *
 * A drawn zone wins over the visible box, so panning around inside a shape
 * does not quietly widen it back to the rectangle. Clearing it hands the map
 * back to its bounds.
 *
 * The pins are the points the server sent, which for a property whose owner
 * did not publish the address is a displaced one. That is deliberate on both
 * sides: the server filters on the same displaced point it draws, so the map
 * cannot be used to work out an address by drawing smaller and smaller shapes
 * around it.
 */
const ResultsMap = ({ list, polygon, regions, onBounds, onPolygon, onRegions }) => {
  const { t } = useTranslation()

  const box = useRef(null)
  const map = useRef(null)
  const pins = useRef([])
  const shape = useRef(null)
  const drawing = useRef(null)
  const info = useRef(null)
  // Fitted once, on the first results that have somewhere to be. Refitting on
  // every fetch would yank the map back the instant somebody panned away —
  // and since panning is what triggers the fetch, it would be a map that
  // cannot be moved.
  const fitted = useRef(false)
  // The department outlines. Held so their styling can be reapplied when the
  // selection changes, without refetching the file.
  const layer = useRef(null)
  // The callbacks, held in a ref so the map's listeners can be registered once
  // and still call whatever the latest render passed down. Registering them as
  // dependencies instead would rebuild the map on every parent render, which
  // throws away the pan the person just did.
  const send = useRef({ onBounds, onPolygon, onRegions })

  // Written in an effect rather than during render: a ref assigned while
  // rendering is a side effect in a function React is allowed to call twice,
  // and the compiler refuses it. No dependency array, so it runs after every
  // render, which is exactly when the callbacks may have changed.
  useEffect(() => {
    send.current = { onBounds, onPolygon, onRegions }
  })

  // Counted from the same rule the pins use, so the note and the map can never
  // disagree about which listings made it on.
  const unplaced = list.filter(
    p => p.property?.latitude === null || p.property?.latitude === undefined,
  ).length

  const [ready, setReady] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [drawMode, setDrawMode] = useState(false)
  // State and not the ref it mirrors: whether the tool exists decides whether
  // a button is drawn, and a ref changing does not re-render anything — the
  // button would stay hidden however well the tool loaded.
  const [hasDraw, setHasDraw] = useState(false)
  // How many department outlines arrived. Zero means the file did not, which
  // the strip below says out loud rather than leaving as silence.
  const [zones, setZones] = useState(null)
  // Whether the view has moved since the last search. Drives the button that
  // offers to search again — the map no longer fetches on its own.
  const [moved, setMoved] = useState(false)

  // The selection as one string. The parent hands down a fresh array every
  // render, so depending on the array restyles all thirty-three shapes
  // whenever anything on the page changes — including while somebody types in
  // a price field. Compared by value instead.
  const chosen = regions.join(',')

  /* ── the map itself, once ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!mapsAvailable) return

    let ignore = false

    loadMaps()
      .then((maps) => {
        if (ignore || !box.current) return

        map.current = new maps.Map(box.current, {
          ...COLOMBIA,
          styles: MAP_STYLE,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          // Greedy here, unlike the map on a listing page: this map *is* the
          // search, so a wheel over it should zoom it rather than scroll past
          // the thing somebody is using.
          gestureHandling: 'greedy',
        })

        info.current = new maps.InfoWindow()

        // Moving the map offers a search; it does not run one.
        //
        // This used to fetch on every `idle`, which is once per gesture — and
        // somebody reading a map pans four or five times before they mean
        // anything by where they have landed. Five requests to answer a
        // question nobody had asked yet.
        //
        // The first two settles are skipped as well: one from the map opening
        // and one from the fit to the results. Neither is somebody moving
        // anything, and both used to fetch.
        let settled = 0

        map.current.addListener('idle', () => {
          settled += 1
          if (settled > 2) setMoved(true)
        })

        // Only if the library arrived. A map without the drawing tool is a
        // map you can still search by moving, and that is worth incomparably
        // more than an apology where the map should be.
        if (canDraw()) {
          drawing.current = new maps.drawing.DrawingManager({
            drawingMode: null,
            drawingControl: false,
            polygonOptions: {
              strokeColor: accent(),
              strokeWeight: 2,
              fillColor: accent(),
              fillOpacity: 0.12,
            },
          })
          drawing.current.setMap(map.current)
          setHasDraw(true)

          drawing.current.addListener('polygoncomplete', (drawn) => {
            // One shape at a time. A second drawing replaces the first
            // rather than adding to it, because "these two areas" is a
            // question this does not answer, and a half-answer is worse.
            if (shape.current) shape.current.setMap(null)
            shape.current = drawn

            drawing.current.setDrawingMode(null)
            setDrawMode(false)

            send.current.onPolygon(
              drawn.getPath().getArray().map(p => `${p.lat().toFixed(5)},${p.lng().toFixed(5)}`).join(';'),
            )
          })
        }

        /* ── the departments, drawn and clickable ─────────────────────── */
        // Colombia's own first-level divisions, which is what somebody means
        // by an area long before they mean a rectangle. Fetched rather than
        // bundled: a hundred kilobytes of coastline is worth carrying by
        // whoever opens the map and by nobody else.
        layer.current = new maps.Data({ map: map.current })

        // The callback is not decoration: without it a file that 404s leaves a
        // map that looks finished and ignores every click, which is
        // indistinguishable from a bug in the click handler and was very
        // nearly diagnosed as one.
        layer.current.loadGeoJson('/departments.geojson', null, (features) => {
          setZones(features?.length ?? 0)
        })

        layer.current.addListener('click', (event) => {
          const region = event.feature.getProperty('region')
          if (region) send.current.onRegions(region)
        })

        // The cursor and the fill have to say the shape is a control.
        // Without this a department reads as decoration printed on a map.
        layer.current.addListener('mouseover', (event) => {
          layer.current.overrideStyle(event.feature, { strokeWeight: 2.5, fillOpacity: 0.32 })
        })
        layer.current.addListener('mouseout', () => layer.current.revertStyle())

        setReady(true)
      })
      .catch((error) => {
        if (ignore) return
        // Distinguished, because they need different words and because
        // blaming an ad blocker for a bug in this file is how the bug hides.
        // A script that never arrived has no `google.maps`; anything else
        // threw while the map was being built.
        setBlocked(!window.google?.maps)
        if (window.google?.maps) console.error('Plaza: the results map failed to build', error)
      })

    return () => { ignore = true }
  }, [])

  /* ── the pins follow the results ───────────────────────────────────────── */
  useEffect(() => {
    if (!ready) return

    const maps = window.google.maps

    pins.current.forEach(pin => pin.setMap(null))
    pins.current = []

    const placed = list.filter(
      p => p.property?.latitude !== null && p.property?.latitude !== undefined,
    )

    placed.forEach((product) => {
      const pin = new maps.Marker({
        map: map.current,
        position: { lat: Number(product.property.latitude), lng: Number(product.property.longitude) },
        title: product.title,
      })

      pin.addListener('click', () => {
        info.current.setContent(
          `<div style="font-family:inherit;max-width:200px">
             <a href="/p/${product.id}" style="color:#254c93;font-weight:600;text-decoration:none">
               ${product.title.replace(/</g, '&lt;')}
             </a>
             <div style="margin-top:2px;color:#5a6274;font-size:13px">
               ${formatMoney(product.price, product.currency)}
             </div>
           </div>`,
        )
        info.current.open({ map: map.current, anchor: pin })
      })

      pins.current.push(pin)
    })

    // The reason the filter looked broken: the map opened over the whole
    // country every time, so every result was always inside the visible box
    // and panning changed nothing. It now starts on the results themselves.
    if (!fitted.current && placed.length) {
      fitted.current = true

      const bounds = new maps.LatLngBounds()
      placed.forEach(p => bounds.extend({
        lat: Number(p.property.latitude),
        lng: Number(p.property.longitude),
      }))

      map.current.fitBounds(bounds, 48)

      // A single result fits to a point, and fitBounds answers that with the
      // deepest zoom there is. Clamped after the fit settles, because the zoom
      // is not final until then.
      maps.event.addListenerOnce(map.current, 'idle', () => {
        if (map.current.getZoom() > MAX_FIT_ZOOM) map.current.setZoom(MAX_FIT_ZOOM)
      })
    }
  }, [ready, list])

  /* ── the departments, coloured by what is chosen ───────────────────────── */
  useEffect(() => {
    if (!ready || !layer.current) return

    const picked = new Set(chosen ? chosen.split(',') : [])
    const ink = accent()

    layer.current.setStyle((feature) => {
      const on = picked.has(feature.getProperty('region'))

      return {
        // Dark hairlines and a soft fill, unchosen: enough to read as a set of
        // shapes somebody is meant to press. The first pass drew them at 0.06
        // opacity, which on a light map is indistinguishable from nothing —
        // and a control nobody can see is a control nobody knows is there.
        strokeColor: on ? ink : '#1a2032',
        strokeWeight: on ? 2.5 : 1,
        strokeOpacity: on ? 1 : 0.7,
        fillColor: on ? ink : '#0f7350',
        fillOpacity: on ? 0.45 : 0.18,
        // Stated rather than left to the default, because it is the whole
        // point of the layer and a default is a thing that can change.
        clickable: true,
        cursor: 'pointer',
      }
    })
  }, [ready, chosen])

  /* ── the drawn shape, cleared from outside ─────────────────────────────── */
  useEffect(() => {
    if (!polygon && shape.current) {
      shape.current.setMap(null)
      shape.current = null
    }
  }, [polygon])

  const search = () => {
    const bounds = map.current?.getBounds()
    if (!bounds) return

    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()

    // Four decimals is about eleven metres. Rounded so that nudging the map by
    // a pixel does not produce a different string, a different query key and a
    // fetch for the same view.
    const at = n => n.toFixed(4)

    setMoved(false)
    send.current.onBounds([at(sw.lat()), at(sw.lng()), at(ne.lat()), at(ne.lng())].join(','))
  }

  const draw = () => {
    if (!drawing.current) return
    const maps = window.google.maps
    drawing.current.setDrawingMode(maps.drawing.OverlayType.POLYGON)
    setDrawMode(true)
  }

  const clear = () => {
    drawing.current?.setDrawingMode(null)
    setDrawMode(false)
    send.current.onPolygon(null)
  }

  if (!mapsAvailable) {
    return (
      <p className="panel px-4 py-6 text-center text-sm text-muted">
        {t('Properties.Map.Unavailable')}
      </p>
    )
  }

  if (blocked) {
    return (
      <p className="panel border-l-[3px] border-l-info px-4 py-6 text-center text-sm text-muted">
        {t('Properties.Map.Blocked')}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {hasDraw && (
          <Button.Action
            type="button"
            variant={drawMode ? 'solid' : 'outline'}
            color="neutral"
            size="sm"
            disabled={!ready}
            onClick={draw}
          >
            <PencilIcon className="size-4" />
            {drawMode ? t('Properties.Map.Drawing') : t('Properties.Map.Draw')}
          </Button.Action>
        )}

        {polygon && (
          <Button.Action type="button" variant="ghost" size="sm" onClick={clear}>
            <XMarkIcon className="size-4" />
            {t('Properties.Map.ClearZone')}
          </Button.Action>
        )}

        <span className="text-xs text-muted">
          {zones === 0
            ? t('Properties.Map.NoZones')
            : polygon ? t('Properties.Map.InZone') : t('Properties.Map.PickHint')}
        </span>

        {/* A property with no coordinate cannot be on the map, and saying so
            is the difference between "there are only two here" and "one of
            yours is missing and you should go and place it". */}
        {unplaced > 0 && (
          <span className="ml-auto text-xs text-faint">
            {t('Properties.Map.Unplaced', { count: unplaced })}
          </span>
        )}
      </div>

      <div className="relative overflow-hidden rounded-pz border border-line">
        <div ref={box} className="h-[32rem] w-full bg-sunk" />

        {/* Over the map rather than beside it, because it is about what the
            map is showing and reads at the moment somebody stops dragging. */}
        {moved && !polygon && (
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
            <Button.Action
              type="button"
              size="sm"
              className="pointer-events-auto shadow-md"
              onClick={search}
            >
              <MagnifyingGlassIcon className="size-4" />
              {t('Properties.Map.SearchHere')}
            </Button.Action>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResultsMap
