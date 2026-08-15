import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Combobox as HCombobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import Field from './Field'
import { control, option, panel } from './styles'

/**
 * Select with a search box, for lists nobody wants to scroll: cities, shipping
 * regions, the category tree. Below roughly a dozen options use Select instead —
 * a search field over six items is friction, not help.
 *
 * `multiple` turns it into a filter rather than a choice, and the difference is
 * not cosmetic. Picking one thing is what a form does: which city is this
 * listing in, which category does it belong to — questions with one true
 * answer. Narrowing a search is the opposite job. Somebody looking for
 * somewhere to live will take a flat or an apartaestudio, in this city or the
 * one they could commute from, and a control that makes them choose one and
 * search four times is a control they stop using.
 *
 * Selected values become chips under the input rather than a summary inside it.
 * "3 seleccionados" is a number somebody has to open a menu to decode, and the
 * whole point of a filter is knowing what it is doing without opening anything.
 *
 * options: [{ value, label, subtitle?, disabled? }]
 */
const Combobox = ({
  label,
  id,
  options = [],
  value = null,
  onChange,
  placeholder,
  emptyMessage,
  optional,
  hint,
  error,
  disabled = false,
  multiple = false,
  className,
  name,
}) => {
  const { t } = useTranslation()
  const auto = useId()
  const inputId = id ?? auto
  const [query, setQuery] = useState('')

  // Headless UI needs an array when multiple, and null is what every caller
  // passes for "nothing chosen yet".
  const held = multiple ? (Array.isArray(value) ? value : []) : value
  const selected = multiple ? null : options.find(o => o.value === value) ?? null
  const chips = multiple ? options.filter(o => held.includes(o.value)) : []

  // Matching the subtitle too, because a shopper searching "Antioquia" should
  // find "Medellín" when the region is what the subtitle carries.
  const needle = query.trim().toLowerCase()
  const filtered = needle
    ? options.filter(o =>
        `${o.label} ${o.subtitle ?? ''}`.toLowerCase().includes(needle),
      )
    : options

  const drop = (chip) => onChange(held.filter(v => v !== chip))

  return (
    <Field
      label={label}
      htmlFor={inputId}
      optional={optional}
      hint={hint}
      error={error}
      className={className}
    >
      <HCombobox
        value={held}
        onChange={onChange}
        disabled={disabled}
        multiple={multiple}
        name={name}
        onClose={() => setQuery('')}
      >
        <div className="relative">
          <ComboboxInput
            id={inputId}
            aria-invalid={error ? true : undefined}
            className={control({ error: !!error, extra: 'pr-10' })}
            // Nothing is written into the field when several are chosen: the
            // field stays a search box, and what is chosen is shown below it.
            displayValue={() => (multiple ? '' : selected?.label ?? '')}
            placeholder={
              multiple && chips.length
                ? t('Shared.Combobox.AddAnother')
                : placeholder ?? t('Shared.Combobox.DefaultPlaceholder')
            }
            onChange={e => setQuery(e.target.value)}
          />
          <ComboboxButton
            disabled={disabled}
            className="absolute inset-y-0 right-0 flex items-center px-2.5 disabled:cursor-not-allowed"
          >
            <ChevronUpDownIcon className={clsx('size-5', disabled ? 'text-faint' : 'text-muted')} />
          </ComboboxButton>
        </div>

        <ComboboxOptions anchor="bottom" transition className={clsx(panel, 'w-(--input-width) origin-top transition duration-100 ease-out data-closed:scale-98 data-closed:opacity-0')}>
          {filtered.length === 0 ? (
            // An empty result is a dead end unless it says what to do next.
            <p className="px-3 py-2 text-sm text-muted">{emptyMessage ?? t('Shared.Combobox.NoMatch')}</p>
          ) : (
            filtered.map(opt => (
              <ComboboxOption key={opt.value} value={opt.value} disabled={opt.disabled} className={option}>
                <span className="min-w-0">
                  <span className="block truncate group-data-selected:font-semibold group-data-selected:text-link">
                    {opt.label}
                  </span>
                  {opt.subtitle && (
                    <span className="block truncate text-xs text-muted">{opt.subtitle}</span>
                  )}
                </span>
                <CheckIcon className="size-4 shrink-0 text-link opacity-0 group-data-selected:opacity-100" />
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </HCombobox>

      {/* Outside the Combobox, so removing one is a button press and not a
          menu interaction. Each carries its own × because taking one back out
          is the commonest thing anybody does to a filter they overshot. */}
      {chips.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {chips.map(chip => (
            <li key={chip.value}>
              <button
                type="button"
                onClick={() => drop(chip.value)}
                className="flex cursor-pointer items-center gap-1 rounded-pz-sm border border-line bg-sunk py-1 pr-1.5 pl-2.5 text-[13px] text-ink transition-colors hover:border-line-strong"
              >
                {chip.label}
                <XMarkIcon className="size-3.5 text-muted" />
                <span className="sr-only">{t('Shared.Combobox.Remove', { label: chip.label })}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  )
}

export default Combobox
