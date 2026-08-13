import clsx from 'clsx'

// Control classes live here rather than beside a component so that the files
// under ui/ export components only. A module that exports both a component and
// a helper breaks React Fast Refresh, which is why the same helpers had to be
// preceded by an eslint-disable in earlier projects.

// Every text-entry control — input, textarea, the select button, the combobox —
// shares this shell so they line up when stacked in a form.
export const control = ({ error = false, disabled = false, extra = '' } = {}) =>
  clsx(
    'w-full rounded-plaza border bg-plaza-paper px-3 py-2 text-sm text-plaza-ink',
    'placeholder:text-plaza-mute transition-colors',
    // Focus is a pine border with a marigold halo. Marigold alone does not carry
    // enough contrast against the stone ground to be the only focus signal.
    'focus:outline-none focus:border-plaza-pine focus:ring-2 focus:ring-plaza-marigold/45',
    error ? 'border-plaza-clay' : 'border-plaza-line',
    disabled && 'cursor-not-allowed bg-plaza-stone text-plaza-mute',
    extra,
  )

// The dropdown panel for both Select and Combobox.
//
// Width is left to the caller. Headless UI publishes the anchor's measurement
// under a name taken from the element it anchored to — --button-width for a
// Listbox, --input-width for a Combobox — so a single shared width class silently
// resolved to nothing on one of the two and the panel collapsed onto its content.
export const panel = clsx(
  // The height cap is marked important because anchoring writes its own
  // max-height inline, computed from the space left in the viewport. That
  // keeps the panel on screen but lets a long list, cities for instance, run
  // the full height of it.
  'max-h-80! overflow-y-auto rounded-plaza border border-plaza-line',
  'bg-plaza-paper p-1 shadow-lg shadow-plaza-ink/10 z-50 mt-1',
  'focus:outline-none empty:hidden',
)

export const option = clsx(
  'group flex cursor-pointer select-none items-center justify-between gap-2',
  'rounded-plaza px-3 py-2 text-sm text-plaza-ink',
  'data-focus:bg-plaza-pine/8 data-disabled:cursor-not-allowed data-disabled:text-plaza-mute',
)

export const labelClass = 'flex items-center gap-1 text-sm font-medium text-plaza-ink'
export const hintClass = 'text-xs text-plaza-mute'
export const errorClass = 'text-xs text-plaza-clay'
