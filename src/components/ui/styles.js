import clsx from 'clsx'

// Control classes live here rather than beside a component so that the files
// under ui/ export components only. A module that exports both a component and
// a helper breaks React Fast Refresh.

// Every text-entry control — input, textarea, the select button, the combobox —
// shares this shell so they line up when stacked in a form.
export const control = ({ error = false, extra = '' } = {}) =>
  clsx(
    'w-full rounded-pz-sm border bg-surface px-3 py-2.5 text-sm text-ink',
    'placeholder:text-faint',
    'transition-[border-color,box-shadow,background-color,color] duration-150',

    // The border carries the colour and a thin ring widens it. A soft glow
    // would read as decoration; on a form the focus state has one job, which is
    // to say where the caret is.
    'focus:outline-none focus:border-link focus:ring-2 focus:ring-link/25',

    error ? 'border-alert' : 'border-line-strong',

    // ── Not applicable right now ──────────────────────────────────────────
    // Everything recedes: the fill, the text, the border. Driven by the real
    // :disabled state rather than by a prop, because a field is disabled by an
    // attribute that any caller can set and only some of them remembered to
    // also tell us about. Written as a variant so it beats the base fill on
    // specificity instead of on whichever class Tailwind happened to emit last.
    'disabled:cursor-not-allowed disabled:border-line disabled:bg-sunk disabled:text-muted',
    'disabled:placeholder:text-faint/60',
    // Headless UI marks its own button controls this way as well as disabling
    // them, and the Listbox and Combobox buttons come through here too.
    'data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-sunk data-disabled:text-muted',

    extra,
  )

/**
 * Readable, but not yours to change. A different thing from disabled, and it
 * has to look different: the text keeps full contrast because reading it is the
 * entire point, and only the field around it recedes. It stays focusable and
 * selectable, so the caret ring goes quiet rather than disappearing.
 *
 * Appended by Input and Textarea rather than living in `control`, because they
 * are the only two things that can be read-only in any useful sense. In CSS
 * `:read-only` matches every element that is not editable — buttons included —
 * and the Listbox button comes through `control` too, which is how the whole
 * Select ended up painted as a read-only field while working perfectly.
 *
 * `not-disabled` because a disabled input also matches `:read-only`, and
 * without it these rules fight the disabled ones at equal specificity.
 */
export const readable = clsx(
  'read-only:not-disabled:cursor-default',
  'read-only:not-disabled:bg-sunk',
  'read-only:not-disabled:border-line',
  'read-only:not-disabled:focus:border-line-strong',
  'read-only:not-disabled:focus:ring-0',
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
  'max-h-80! overflow-y-auto rounded-pz border border-line',
  'bg-surface py-1.5 shadow-[0_16px_40px_-12px_hsl(var(--pz-shadow)/0.35)] z-50 mt-1.5',
  'focus:outline-none empty:hidden',
)

export const option = clsx(
  'group flex cursor-pointer select-none items-center justify-between gap-3',
  'mx-1.5 rounded-pz-sm px-2.5 py-2 text-sm text-ink',
  'data-focus:bg-sunk data-disabled:cursor-not-allowed data-disabled:text-faint',
)

export const labelClass = 'flex items-center gap-1.5 text-[13px] font-medium text-ink'
export const hintClass = 'text-xs leading-relaxed text-faint'
export const errorClass = 'text-xs leading-relaxed font-medium text-alert'
