import { useId } from 'react'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import Field from './Field'
import { control, option, panel } from './styles'

/**
 * Select built on a Headless UI Listbox rather than a native `<select>`.
 *
 * A native select cannot be styled past its border on most platforms and its
 * option list is drawn by the OS, so on a marketplace where a category picker
 * needs a second line of context ("Home · 1,204 listings") it simply cannot show
 * it. This keeps the keyboard behaviour and the ARIA roles of the native
 * control and gives the list back to us.
 *
 * options: [{ value, label, subtitle?, disabled? }]
 */
const Select = ({
  label,
  id,
  options = [],
  value = null,
  onChange,
  placeholder = 'Choose one',
  optional,
  hint,
  error,
  disabled = false,
  className,
  name,
}) => {
  const auto = useId()
  const buttonId = id ?? auto
  const selected = options.find(o => o.value === value) ?? null

  return (
    <Field
      label={label}
      htmlFor={buttonId}
      optional={optional}
      hint={hint}
      error={error}
      className={className}
    >
      <Listbox value={value} onChange={onChange} disabled={disabled} name={name}>
        <ListboxButton
          id={buttonId}
          aria-invalid={error ? true : undefined}
          className={control({
            error: !!error,
            disabled,
            extra: 'flex items-center justify-between gap-2 text-left',
          })}
        >
          <span className={clsx('truncate', !selected && 'text-muted')}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronUpDownIcon className="size-5 shrink-0 text-muted" />
        </ListboxButton>

        {/* anchor keeps the panel pinned to the button through scroll, and
            w-(--input-width) makes it exactly as wide as the control. */}
        <ListboxOptions anchor="bottom" transition className={clsx(panel, 'w-(--button-width) origin-top transition duration-100 ease-out data-closed:scale-98 data-closed:opacity-0')}>
          {options.map(opt => (
            <ListboxOption key={opt.value} value={opt.value} disabled={opt.disabled} className={option}>
              <span className="min-w-0">
                <span className="block truncate group-data-selected:font-semibold group-data-selected:text-link">
                  {opt.label}
                </span>
                {opt.subtitle && (
                  <span className="block truncate text-xs text-muted">{opt.subtitle}</span>
                )}
              </span>
              <CheckIcon className="size-4 shrink-0 text-link opacity-0 group-data-selected:opacity-100" />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </Field>
  )
}

export default Select
