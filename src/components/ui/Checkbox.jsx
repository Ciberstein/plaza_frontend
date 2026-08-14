import { Checkbox as HCheckbox, Description, Field, Label } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'
import { errorClass, hintClass } from './styles'

/**
 * Built from Headless UI's Field, Label and Description rather than a plain
 * `<label htmlFor>`.
 *
 * The obvious version does not work: Headless UI's Checkbox renders a
 * `<span role="checkbox">`, and `htmlFor` only binds to elements the HTML spec
 * calls labelable. A span is not one, so the association silently did nothing
 * and the only place that toggled the box was the 20 pixel square itself.
 *
 * Field wires the three together through context instead, which also hands the
 * hint and the error to the control as `aria-describedby` — something the
 * hand-rolled version never did either.
 */
const Checkbox = ({ label, id, hint, error, checked = false, onChange, disabled, className }) => {
  // Resolved here rather than left to competing data- variants. A checked box
  // that is also disabled matches both `data-checked` and `data-disabled` at
  // the same specificity, so which one wins comes down to emit order, and the
  // losing round is a disabled control painted in the full accent.
  const box = disabled
    ? 'cursor-not-allowed border-line bg-sunk data-checked:border-muted data-checked:bg-muted'
    : clsx(
        'cursor-pointer bg-surface data-checked:border-accent data-checked:bg-accent',
        error ? 'border-alert' : 'border-line',
      )

  return (
    <Field disabled={disabled} className={clsx('flex flex-col gap-1.5', className)}>
      <div className="flex items-center gap-2.5">
        <HCheckbox
          id={id}
          checked={checked}
          onChange={onChange}
          className={clsx(
            'flex size-5 shrink-0 items-center justify-center rounded-pz-sm border',
            'transition-colors data-focus:ring-2 data-focus:ring-link/40',
            box,
          )}
        >
          <CheckIcon
            className={clsx(
              'size-3.5 opacity-0 group-data-checked:opacity-100 data-checked:opacity-100',
              // The tick sits on a grey fill once disabled, where the dark ink
              // meant for the accent would all but vanish.
              disabled ? 'text-surface' : 'text-on-accent',
            )}
          />
        </HCheckbox>

        <Label
          className={clsx(
            'text-sm',
            // A label that looks clickable when clicking it does nothing is the
            // control lying about itself. Now it is not lying either way.
            disabled ? 'cursor-not-allowed text-muted' : 'cursor-pointer text-ink',
          )}
        >
          {label}
        </Label>
      </div>

      {error ? (
        <Description className={errorClass}>{error}</Description>
      ) : hint ? (
        <Description className={hintClass}>{hint}</Description>
      ) : null}
    </Field>
  )
}

export default Checkbox
