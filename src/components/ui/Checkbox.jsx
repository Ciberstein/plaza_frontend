import { useId } from 'react'
import { Checkbox as HCheckbox } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'
import { errorClass, hintClass } from './styles'

const Checkbox = ({ label, id, hint, error, checked = false, onChange, disabled, className }) => {
  const auto = useId()
  const boxId = id ?? auto

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <div className="flex items-start gap-2.5">
        <HCheckbox
          id={boxId}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={clsx(
            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-pz-sm border bg-surface',
            'transition-colors data-checked:border-accent data-checked:bg-accent',
            'data-focus:ring-2 data-focus:ring-link/40',
            'data-disabled:cursor-not-allowed data-disabled:bg-sunk',
            error ? 'border-alert' : 'border-line',
          )}
        >
          <CheckIcon className="size-3.5 text-on-accent opacity-0 group-data-checked:opacity-100 data-checked:opacity-100" />
        </HCheckbox>

        <label htmlFor={boxId} className="cursor-pointer text-sm text-ink">
          {label}
        </label>
      </div>

      {error ? <p className={errorClass}>{error}</p> : hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  )
}

export default Checkbox
