import { useId, useState } from 'react'
import {
  Combobox as HCombobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import Field from './Field'
import { control, option, panel } from './styles'

/**
 * Select with a search box, for lists nobody wants to scroll: cities, shipping
 * regions, the category tree. Below roughly a dozen options use Select instead —
 * a search field over six items is friction, not help.
 *
 * options: [{ value, label, subtitle?, disabled? }]
 */
const Combobox = ({
  label,
  id,
  options = [],
  value = null,
  onChange,
  placeholder = 'Search',
  emptyMessage = 'Nothing matches that search',
  optional,
  hint,
  error,
  disabled = false,
  className,
  name,
}) => {
  const auto = useId()
  const inputId = id ?? auto
  const [query, setQuery] = useState('')

  const selected = options.find(o => o.value === value) ?? null

  // Matching the subtitle too, because a shopper searching "Antioquia" should
  // find "Medellín" when the region is what the subtitle carries.
  const needle = query.trim().toLowerCase()
  const filtered = needle
    ? options.filter(o =>
        `${o.label} ${o.subtitle ?? ''}`.toLowerCase().includes(needle),
      )
    : options

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
        value={value}
        onChange={onChange}
        disabled={disabled}
        name={name}
        onClose={() => setQuery('')}
      >
        <div className="relative">
          <ComboboxInput
            id={inputId}
            aria-invalid={error ? true : undefined}
            className={control({ error: !!error, extra: 'pr-10' })}
            displayValue={() => selected?.label ?? ''}
            placeholder={placeholder}
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
            <p className="px-3 py-2 text-sm text-muted">{emptyMessage}</p>
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
    </Field>
  )
}

export default Combobox
