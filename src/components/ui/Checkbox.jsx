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
            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-plaza border bg-plaza-surface',
            'transition-colors data-checked:border-plaza-action data-checked:bg-plaza-action',
            'data-focus:ring-2 data-focus:ring-plaza-action/40',
            'data-disabled:cursor-not-allowed data-disabled:bg-plaza-hover',
            error ? 'border-plaza-alert' : 'border-plaza-line',
          )}
        >
          <CheckIcon className="size-3.5 text-white opacity-0 group-data-checked:opacity-100 data-checked:opacity-100" />
        </HCheckbox>

        <label htmlFor={boxId} className="cursor-pointer text-sm text-plaza-ink">
          {label}
        </label>
      </div>

      {error ? <p className={errorClass}>{error}</p> : hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  )
}

export default Checkbox
