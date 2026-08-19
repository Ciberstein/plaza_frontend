import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import PropertyCard from '../../shared/PropertyCard'
import { Button } from '../../ui'
import Filters from './Filters'
import ResultsMap from './ResultsMap'
import { mapsAvailable } from '../../../utils/googleMaps'
import products from '../../../services/products.services'
import { useResource } from '../../../hooks/useResource'

// Wider cards than the goods grid, three across at most. A property card
// carries four numbers and a neighbourhood; squeezed to a fifth of the row it
// carries none of them legibly.
const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'

/**
 * The map view, off for now.
 *
 * One flag rather than deleting anything, because what is behind it works and
 * is covered: the department outlines, the area search, and the part that
 * matters — a zone filter that judges the *displaced* point, so drawing
 * smaller and smaller shapes around a listing cannot recover an address its
 * owner chose not to publish. That property took real thought and would have
 * to be rediscovered.
 *
 * The backend keeps its `bbox` and `polygon` parameters. They are inert with
 * nothing sending them, and they are what this switches back on.
 */
const MAP_ENABLED = false

// Everything that can narrow a search, named once. The list is what the page
// reads out of the URL, what it sends to the API, and what "clear filters"
// clears — three things that drift apart the moment they are written down
// three times.
const FILTERS = [
  'operation', 'category', 'region', 'cityId', 'propertyCondition',
  'minPrice', 'maxPrice', 'minArea', 'maxArea',
  'bedrooms', 'bathrooms', 'parking', 'stratum', 'features',
  // The area of the map. `bbox` is what the map can see, `polygon` is a shape
  // somebody drew; the server prefers the drawn one when both are present.
  'bbox', 'polygon',
]

const Skeleton = () => (
  <div className={GRID} aria-hidden>
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="overflow-hidden rounded-pz border border-line bg-surface">
        <div className="aspect-4/3 animate-pulse bg-sunk" />
        <div className="flex flex-col gap-2 p-3">
          <div className="h-5 w-32 animate-pulse rounded-full bg-sunk" />
          <div className="h-3 w-40 animate-pulse rounded-full bg-sunk" />
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-sunk" />
        </div>
      </div>
    ))}
  </div>
)

/**
 * The third aisle.
 *
 * A page of its own rather than the home grid with a different `kind`, because
 * the filters are the feature. Somebody buying a shirt browses; somebody
 * looking for somewhere to live is narrowing eleven axes at once, and they
 * arrive knowing most of the answers already.
 */
const Properties = () => {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [onMap, setOnMap] = useState(false)

  // The URL, read as an object once per render rather than queried key by key
  // at every call site.
  const filters = useMemo(() => {
    const held = {}
    for (const key of FILTERS) {
      // An area in the URL, from a bookmark or an older session, would narrow
      // the list while the map that explains it is not on screen. Ignored
      // rather than obeyed: a filter nobody can see is a filter nobody can
      // undo.
      if (!MAP_ENABLED && (key === 'bbox' || key === 'polygon')) continue

      const value = params.get(key)
      if (value) held[key] = value
    }
    return held
  }, [params])

  // The area is not counted as a filter. It is the map's own state, and a
  // panned map lighting up "clear filters" would offer to undo something
  // nobody set.
  const active = Object.keys(filters).filter(f => f !== 'bbox' && f !== 'polygon').length

  const set = useCallback((key, value) => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (value === null || value === undefined || value === '') next.delete(key)
      else next.set(key, value)
      return next
    }, { replace: true })
  }, [setParams])

  const clear = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams])

  // The key is the whole query, so changing any one filter refetches rather
  // than painting the previous answer under the new heading.
  const key = FILTERS.map(f => filters[f] ?? '').join('|')
  const load = useCallback(
    () => products.browse({ kind: 'property', ...filters }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )

  const { data, loading } = useResource(load, key)
  const list = data ?? []

  return (
    <div className="shell py-8 sm:py-10">
      <div className="max-w-prose">
        <h1 className="rule-accent font-display text-2xl leading-tight font-bold tracking-tight text-ink sm:text-3xl">
          {t('Properties.Title')}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">{t('Properties.Intro')}</p>
      </div>

      <div className="mt-6">
        <Filters params={filters} set={set} clear={clear} active={active} />
      </div>

      {/* Only offered when there is a map to offer. Without a key configured
          the toggle would lead to an apology. */}
      {MAP_ENABLED && mapsAvailable && (
        <div className="mt-6 flex gap-1 rounded-pz-sm border border-line p-1 w-fit">
          {[['list', t('Properties.View.List')], ['map', t('Properties.View.Map')]].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setOnMap(value === 'map')
                // Leaving the map drops the area with it. A box left in the
                // URL would silently narrow the list on a screen with nothing
                // to show it was there.
                if (value === 'list') { set('bbox', null); set('polygon', null) }
              }}
              className={
                'cursor-pointer rounded-pz-sm px-4 py-1.5 text-[13px] font-medium transition-colors ' +
                (onMap === (value === 'map')
                  ? 'bg-ink text-ground'
                  : 'text-muted hover:text-ink')
              }
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {MAP_ENABLED && onMap && (
        <div className="mt-4">
          <ResultsMap
            list={list}
            polygon={filters.polygon ?? null}
            regions={filters.region ? filters.region.split(',') : []}
            onBounds={(bbox) => {
              // A chosen department already says where to look, and a box on
              // top of it would narrow the search to whatever happens to be on
              // screen — which is not what clicking a department meant.
              if (!filters.polygon && !filters.region) set('bbox', bbox)
            }}
            onPolygon={(ring) => { set('polygon', ring); if (ring) set('bbox', null) }}
            onRegions={(region) => {
              const held = filters.region ? filters.region.split(',') : []
              const next = held.includes(region)
                ? held.filter(r => r !== region)
                : [...held, region]

              set('region', next.length ? next.join(',') : null)
              // The visible box goes with it. Panning set it, and it would now
              // be silently intersecting with the department just chosen.
              set('bbox', null)
              // A drawn shape and a chosen department are two answers to one
              // question, so the newer one replaces the older.
              set('polygon', null)
            }}
          />
        </div>
      )}

      {/* Only once there is something to count. "0 inmuebles" above an empty
          state says the same thing twice. */}
      {!loading && list.length > 0 && (
        <p className="tabular mt-6 text-sm text-muted">
          {t('Properties.Count', { count: list.length })}
        </p>
      )}

      <div className="mt-4">
        {loading ? (
          <Skeleton />
        ) : list.length === 0 ? (
          <div className="panel flex flex-col items-center gap-4 px-6 py-16 text-center">
            <h2 className="font-display text-xl font-semibold text-ink">
              {t('Properties.Empty.Title')}
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              {t('Properties.Empty.Body')}
            </p>
            {active > 0 ? (
              <Button.Action type="button" size="sm" className="mt-1" onClick={clear}>
                {t('Properties.Filters.Clear')}
              </Button.Action>
            ) : (
              <Button.Action as={Link} to="/sell" size="sm" className="mt-1">
                {t('Common.SellOnPlaza')}
              </Button.Action>
            )}
          </div>
        ) : (
          <div className={GRID}>
            {list.map((product, i) => (
              <PropertyCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Properties
