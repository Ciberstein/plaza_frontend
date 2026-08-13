import { useId } from 'react'
import Field from './Field'
import { control } from './styles'

const Textarea = ({ label, id, optional, hint, error, className, rows = 4, ...props }) => {
  const auto = useId()
  const areaId = id ?? auto

  return (
    <Field
      label={label}
      htmlFor={areaId}
      optional={optional}
      hint={hint}
      error={error}
      className={className}
    >
      <textarea
        id={areaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={control({ error: !!error, disabled: props.disabled, extra: 'resize-y' })}
        {...props}
      />
    </Field>
  )
}

export default Textarea
