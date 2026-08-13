import clsx from 'clsx'

// Control classes live here rather than beside a component so that the files
// under ui/ export components only. A module that exports both a component and
// a helper breaks React Fast Refresh.

// Every text-entry control — input, textarea, the select button, the combobox —
// shares this shell so they line up when stacked in a form.
export const control = ({ error = false, disabled = false, extra = '' } = {}) =>
  clsx(
    'w-full rounded-plaza border bg-plaza-surface px-3 py-2.5 text-sm text-plaza-ink',
    'placeholder:text-plaza-faint transition-colors',
    // One blue, used here as it is used on links and buttons. A thin ring, not
    // a glow: the border carrying the colour is enough to locate the field.
    'focus:outline-none focus:border-plaza-action focus:ring-1 focus:ring-plaza-action',
    error ? 'border-plaza-alert' : 'border-plaza-line',
    disabled && 'cursor-not-allowed bg-plaza-hover text-plaza-muted',
    extra,
  )

// The dropdown panel for Select, Combobox and the account menu.
//
// Width is left to the caller. Headless UI publishes the anchor's measurement
// under a name taken from the element it anchored to — --button-width for a
// Listbox, --input-width for a Combobox — so a single shared width class
// silently resolved to nothing on one of the two and collapsed the panel onto
// its content.
export const panel = clsx(
  // Marked important because anchoring writes its own max-height inline,
  // computed from the space left in the viewport, which otherwise lets a long
  // list run the full height of the screen.
  'max-h-80! overflow-y-auto rounded-plaza border border-plaza-line',
  'bg-plaza-surface py-1 shadow-lg z-50 mt-1',
  'focus:outline-none empty:hidden',
)

export const option = clsx(
  'group flex cursor-pointer select-none items-center justify-between gap-2',
  'px-4 py-2.5 text-sm text-plaza-ink',
  'data-focus:bg-plaza-hover data-disabled:cursor-not-allowed data-disabled:text-plaza-faint',
)

export const labelClass = 'flex items-center gap-1 text-sm text-plaza-ink'
export const hintClass = 'text-xs text-plaza-muted'
export const errorClass = 'text-xs text-plaza-alert'
