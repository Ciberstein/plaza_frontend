import { useId, useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import Field from './Field'
import { control } from './styles'

/**
 * Text input. `type="password"` gains a show/hide toggle.
 *
 * `ref` is accepted as a plain prop so `{...register('email')}` from
 * react-hook-form can be spread straight onto it.
 */
const Input = ({
  label,
  id,
  optional,
  hint,
  error,
  className,
  type = 'text',
  prefix,
  ...props
}) => {
  const auto = useId()
  const inputId = id ?? auto
  const [visible, setVisible] = useState(false)

  const isPassword = type === 'password'
  const resolvedType = isPassword && visible ? 'text' : type

  return (
    <Field
      label={label}
      htmlFor={inputId}
      optional={optional}
      hint={hint}
      error={error}
      className={className}
    >
      <div className="relative">
        {/* A currency or unit marker sits inside the control so the value reads
            as one thing rather than a label and a number that drifted apart. */}
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-plaza-mute">
            {prefix}
          </span>
        )}

        <input
          id={inputId}
          type={resolvedType}
          aria-invalid={error ? true : undefined}
          className={control({
            error: !!error,
            disabled: props.disabled,
            extra: [prefix && 'pl-8', isPassword && 'pr-10'].filter(Boolean).join(' '),
          })}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-plaza-mute hover:text-plaza-ink"
          >
            {visible ? <EyeSlashIcon className="size-5" /> : <EyeIcon className="size-5" />}
          </button>
        )}
      </div>
    </Field>
  )
}

export default Input
