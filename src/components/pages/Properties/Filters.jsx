import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { Button, Checkbox, Combobox, Input, Select } from '../../ui'
import { useLanguage } from '../../../context/language'
import { useMeta } from '../../../context/meta'
import {
  withCategoryLabels,
  withFeatureLabels,
  withOperationLabels,
  withPropertyConditionLabels,
} from '../../../utils/vocabulary'

/**
 * The filters, over the URL.
 *
 * Everything lives in the query string rather than in state, which is what
 * makes a filtered search shareable, bookmarkable and survivable by the back
 * button. Somebody who spent two minutes narrowing to "three bedrooms, estrato
 * 4, with a lift, under two million" should be able to send that to whoever
 * they are moving in with.
 *
 * Almost everything takes several values, and that is the difference between a
 * form and a filter. A form asks which city this listing is in — one true
 * answer. Somebody looking for somewhere to live will take a flat or an
 * apartaestudio, here or in the town they could commute from, and a control
 * that makes them pick one and search four times is a control they abandon.
 *
 * The one exception is the operation. With two values, choosing both is the
 * same as choosing neither, so it stays a single choice whose empty state
 * means both — a filter whose "all" has two spellings reads as broken.
 *
 * Two tiers, and the split is not arbitrary. The four on top are what every
 * search starts with — sale or rent, what kind, where, how much — and the rest
 * are what a search that has already returned too much is narrowed by. Showing
 * all twelve at once makes the page look like a tax return.
 */

// Minimums, offered as a short row rather than a free number: nobody searches
// for a flat with at least seven bathrooms, and the tail of the range is noise
// that makes the useful part harder to hit.
const COUNTS = [1, 2, 3, 4]

const Group = ({ label, children }) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="mb-1 text-[13px] font-semibold text-ink">{label}</legend>
    {children}
  </fieldset>
)

/** A row of "at least" buttons, with "any" as the way back out. */
const AtLeast = ({ label, value, onChange }) => {
  const { t } = useTranslation()

  const pill = (active) =>
    clsx(
      'h-9 min-w-11 cursor-pointer rounded-pz-sm border px-3 text-[13px] font-medium transition-colors',
      active
        ? 'border-ink bg-ink text-ground'
        : 'border-line text-muted hover:border-line-strong hover:text-ink',
    )

  return (
    <Group label={label}>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => onChange(null)} className={pill(!value)}>
          {t('Properties.Filters.Any')}
        </button>
        {COUNTS.map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(String(n))}
            className={pill(value === String(n))}
          >
            {t('Properties.Filters.AtLeast', { count: n })}
          </button>
        ))}
      </div>
    </Group>
  )
}

const Filters = ({ params, set, clear, active }) => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const meta = useMeta()
  const [open, setOpen] = useState(false)

  const operations = withOperationLabels(t, meta.operations)
  const conditions = withPropertyConditionLabels(t, meta.propertyConditions)
  const features = withFeatureLabels(t, meta.features)
  const categories = withCategoryLabels(language, meta.categories, 'property')

  // A comma-separated parameter as a list, and back. The URL is the state, so
  // this is the only translation between the two.
  const many = (key) => (params[key] ? params[key].split(',') : [])
  const setMany = (key, values) => set(key, values.length ? values.join(',') : null)

  // Parents and children in one list, the children marked with the aisle they
  // sit under — the same shape the editor's picker uses, for the same reason:
  // somebody looking for a flat thinks "apartamento", not "Vivienda, then
  // Apartamento".
  const types = categories.flatMap(parent => [
    { value: parent.slug, label: parent.label },
    ...(parent.children ?? []).map(child => ({
      value: child.slug,
      label: child.label,
      subtitle: parent.label,
    })),
  ])

  const chosenRegions = many('region')

  // Narrowed to the chosen departments when there are any. Fifty-three towns
  // in one list is a list nobody reads, and somebody who already said
  // "Antioquia" has told us which ones they mean.
  const cities = meta.cities
    .filter(city => !chosenRegions.length || chosenRegions.includes(city.subtitle))
    .map(city => ({ value: String(city.value), label: city.label, subtitle: city.subtitle }))

  const renting = params.operation === 'rent'
  const held = many('features')

  return (
    <div className="panel flex flex-col gap-5 p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label={t('Properties.Filters.Operation')}
          options={operations}
          value={params.operation ?? null}
          onChange={value => set('operation', value)}
          placeholder={t('Properties.Filters.AnyOperation')}
        />

        <Combobox
          multiple
          label={t('Properties.Filters.Type')}
          hint={t('Properties.Filters.TypeHint')}
          options={types}
          value={many('category')}
          onChange={values => setMany('category', values)}
          placeholder={t('Properties.Filters.AnyType')}
        />

        <Combobox
          multiple
          label={t('Properties.Filters.Region')}
          options={meta.regions}
          value={chosenRegions}
          onChange={(values) => {
            setMany('region', values)
            // Any city that no longer belongs to a chosen department goes with
            // it. Left behind, it would be a filter for a town the list below
            // no longer offers — a search returning nothing for a reason
            // nobody can see.
            const allowed = new Set(
              meta.cities
                .filter(c => !values.length || values.includes(c.subtitle))
                .map(c => String(c.value)),
            )
            setMany('cityId', many('cityId').filter(id => allowed.has(id)))
          }}
          placeholder={t('Properties.Filters.AnyRegion')}
        />

        <Combobox
          multiple
          label={t('Properties.Filters.City')}
          options={cities}
          value={many('cityId')}
          onChange={values => setMany('cityId', values)}
          placeholder={t('Properties.Filters.AnyCity')}
        />
      </div>

      {open && (
        <div className="flex flex-col gap-5 border-t border-line pt-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* The label follows the operation, because two and a half million
                is a bargain for a flat and robbery for a month. */}
            <Input
              type="number"
              label={`${renting ? t('Properties.Filters.PriceRent') : t('Properties.Filters.Price')} — ${t('Properties.Filters.Min')}`}
              value={params.minPrice ?? ''}
              onChange={e => set('minPrice', e.target.value)}
            />
            <Input
              type="number"
              label={t('Properties.Filters.Max')}
              value={params.maxPrice ?? ''}
              onChange={e => set('maxPrice', e.target.value)}
            />
            <Input
              type="number"
              label={`${t('Properties.Filters.Area')} — ${t('Properties.Filters.Min')}`}
              value={params.minArea ?? ''}
              onChange={e => set('minArea', e.target.value)}
            />
            <Input
              type="number"
              label={t('Properties.Filters.Max')}
              value={params.maxArea ?? ''}
              onChange={e => set('maxArea', e.target.value)}
            />
          </div>

          {/* New and off-plan are a pair somebody means together, so this one
              takes several where the operation does not. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Combobox
              multiple
              label={t('Properties.Filters.Condition')}
              options={conditions}
              value={many('propertyCondition')}
              onChange={values => setMany('propertyCondition', values)}
              placeholder={t('Properties.Filters.AnyCondition')}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AtLeast
              label={t('Properties.Filters.Bedrooms')}
              value={params.bedrooms}
              onChange={value => set('bedrooms', value)}
            />
            <AtLeast
              label={t('Properties.Filters.Bathrooms')}
              value={params.bathrooms}
              onChange={value => set('bathrooms', value)}
            />
            <AtLeast
              label={t('Properties.Filters.Parking')}
              value={params.parking}
              onChange={value => set('parking', value)}
            />
          </div>

          <Group label={t('Properties.Filters.Stratum')}>
            <div className="flex flex-wrap gap-1.5">
              {meta.strata.map(({ value }) => {
                const chosen = many('stratum').includes(String(value))

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      const list = many('stratum')
                      setMany('stratum', chosen
                        ? list.filter(s => s !== String(value))
                        : [...list, String(value)])
                    }}
                    className={clsx(
                      'size-9 cursor-pointer rounded-pz-sm border text-[13px] font-medium transition-colors',
                      chosen
                        ? 'border-ink bg-ink text-ground'
                        : 'border-line text-muted hover:border-line-strong hover:text-ink',
                    )}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </Group>

          <Group label={t('Properties.Filters.Features')}>
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(feature => (
                <Checkbox
                  key={feature.value}
                  label={feature.label}
                  checked={held.includes(feature.value)}
                  onChange={() =>
                    setMany('features', held.includes(feature.value)
                      ? held.filter(f => f !== feature.value)
                      : [...held, feature.value])
                  }
                />
              ))}
            </div>
          </Group>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button.Action
          type="button"
          variant="outline"
          color="neutral"
          size="sm"
          onClick={() => setOpen(o => !o)}
        >
          <AdjustmentsHorizontalIcon className="size-4" />
          {open ? t('Properties.Filters.Hide') : t('Properties.Filters.Show')}
        </Button.Action>

        {active > 0 && (
          <Button.Action type="button" variant="ghost" size="sm" onClick={clear}>
            <XMarkIcon className="size-4" />
            {t('Properties.Filters.Clear')}
          </Button.Action>
        )}
      </div>
    </div>
  )
}

export default Filters
