import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { subscribe } from '../../utils/notify'

const TONES = {
  error: 'border-plaza-clay bg-plaza-clay text-plaza-paper',
  success: 'border-plaza-pine bg-plaza-pine text-plaza-paper',
  info: 'border-plaza-line bg-plaza-paper text-plaza-ink',
}

const LIFETIME = 6000

const Toasts = () => {
  const [toasts, setToasts] = useState([])

  useEffect(() => subscribe(toast => {
    setToasts(current => [...current, toast])
    setTimeout(
      () => setToasts(current => current.filter(t => t.id !== toast.id)),
      LIFETIME,
    )
  }), [])

  const dismiss = id => setToasts(current => current.filter(t => t.id !== id))

  return (
    // aria-live so the message is announced; a toast nobody can hear is a toast
    // that only exists for sighted users.
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-100 flex flex-col items-center gap-2 p-4"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={clsx(
            'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-plaza border px-4 py-3 text-sm shadow-lg',
            TONES[toast.tone] ?? TONES.info,
          )}
        >
          <p className="grow">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss"
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <XMarkIcon className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default Toasts
