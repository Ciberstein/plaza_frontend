import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { errorClass, hintClass, labelClass } from './styles'

/**
 * Label, hint and error around any control.
 *
 * The error replaces the hint instead of stacking under it: two lines of small
 * text under one field makes the form jump as the user types, and once a field
 * is wrong the hint is no longer the thing they need to read.
 */
const Field = ({ label, htmlFor, optional, hint, error, className, children }) => {
  const { t } = useTranslation()

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className={labelClass}>
          {label}
          {optional && <span className="text-xs font-normal text-muted">{t('Common.Optional')}</span>}
        </label>
      )}

      {children}

      {error ? (
        <p className={errorClass}>{error}</p>
      ) : hint ? (
        <p className={hintClass}>{hint}</p>
      ) : null}
    </div>
  )
}

export default Field
