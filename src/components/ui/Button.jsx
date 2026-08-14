import clsx from 'clsx'

// ─────────────────────────────────────────────────────────────────────────────
// Two axes, not one.
//
// `variant` is how much ink the button spends: solid, soft, outline, ghost.
// `color` is what it means: primary, neutral, success, danger.
//
// They are separate because they vary independently. A destructive action is
// sometimes the loudest thing on screen and sometimes the quietest link in a
// row, and with a single list of styles the second one has no name — which is
// how `variant="ghost" className="text-alert"` ends up in a codebase. That is
// a style the component could not express, patched at the call site, where it
// drifts out of step with every other button that meant the same thing.
// ─────────────────────────────────────────────────────────────────────────────

// The cheapest possible signal about whether pressing will do anything.
const CURSORS = {
  normal: 'cursor-pointer',
  loading: 'cursor-progress',
  disabled: 'cursor-not-allowed',
}

const cursorFor = (disabled, loading) =>
  disabled ? CURSORS.disabled : loading ? CURSORS.loading : CURSORS.normal

const Spinner = () => (
  <span
    aria-hidden
    className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
  />
)

/**
 * An anchor is not a button and cannot be disabled by an attribute, so the two
 * are told apart here rather than at every call site. A call to action is often
 * a link, and a link that looks like a button still has to open in a new tab on
 * middle click, which is the whole reason `as` exists.
 */
const nativeProps = (As, { type, disabled, loading }) =>
  As === 'button'
    ? { type, disabled: disabled || loading }
    : { 'aria-disabled': disabled || loading || undefined }

/* ── Action ───────────────────────────────────────────────────────────────────
   The ordinary button: a label, sometimes an icon, always a hit area big
   enough for a thumb. Heights are fixed so a row of them lines up whatever is
   inside each one.
   ────────────────────────────────────────────────────────────────────────── */

const ACTION_SIZES = {
  sm: 'h-9 gap-1.5 px-3.5 text-[13px]',
  md: 'h-11 gap-2 px-5 text-sm',
  lg: 'h-13 gap-2 px-7 text-base',
}

const ACTION_VARIANTS = {
  solid: {
    primary: 'border-transparent bg-accent text-on-accent hover:bg-accent-deep',
    neutral: 'border-transparent bg-ink text-ground hover:brightness-150',
    success: 'border-transparent bg-good text-on-good hover:brightness-110',
    danger: 'border-transparent bg-alert text-on-alert hover:brightness-110',
  },
  soft: {
    primary: 'border-transparent bg-accent-tint text-link hover:brightness-95',
    neutral: 'border-transparent bg-sunk text-ink hover:brightness-95',
    success: 'border-transparent bg-good-tint text-good hover:brightness-95',
    danger: 'border-transparent bg-alert-tint text-alert hover:brightness-95',
  },
  outline: {
    primary: 'border-accent text-link hover:bg-accent-tint',
    neutral: 'border-line-strong text-ink hover:border-ink hover:bg-sunk',
    success: 'border-good text-good hover:bg-good-tint',
    danger: 'border-alert text-alert hover:bg-alert-tint',
  },
  ghost: {
    primary: 'border-transparent text-link hover:bg-accent-tint',
    neutral: 'border-transparent text-muted hover:bg-sunk hover:text-ink',
    success: 'border-transparent text-good hover:bg-good-tint',
    danger: 'border-transparent text-alert hover:bg-alert-tint',
  },
}

export const Action = ({
  as: As = 'button',
  variant = 'solid',
  color = 'primary',
  size = 'md',
  full = false,
  loading = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...props
}) => (
  <As
    {...nativeProps(As, { type, disabled, loading })}
    aria-busy={loading || undefined}
    className={clsx(
      'inline-flex shrink-0 items-center justify-center rounded-pz-sm border',
      'font-medium whitespace-nowrap',
      'transition-[background-color,border-color,transform,filter] duration-150',
      // One pixel of travel. The cheapest way to make a control feel pushed
      // rather than merely repainted.
      'active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
      'aria-disabled:pointer-events-none aria-disabled:opacity-50',
      cursorFor(disabled, loading),
      ACTION_VARIANTS[variant]?.[color] ?? ACTION_VARIANTS.solid.primary,
      ACTION_SIZES[size] ?? ACTION_SIZES.md,
      full && 'w-full',
      className,
    )}
    {...props}
  >
    {loading && <Spinner />}
    {children}
  </As>
)

/* ── Icon ─────────────────────────────────────────────────────────────────────
   For actions with no label: remove, make cover, dismiss, search. Always a
   perfect circle, because the size classes set width and height to the same
   value, so every icon action in the app is the same shape regardless of the
   glyph inside it.

   `overlay` is the one that sits on top of a photograph, where none of the
   page's own colours can be relied on to have any contrast at all.
   ────────────────────────────────────────────────────────────────────────── */

const ICON_SIZES = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-11',
}

const ICON_VARIANTS = {
  ghost: {
    neutral: 'text-muted hover:bg-sunk hover:text-ink',
    primary: 'text-muted hover:bg-accent-tint hover:text-link',
    success: 'text-muted hover:bg-good-tint hover:text-good',
    danger: 'text-muted hover:bg-alert-tint hover:text-alert',
  },
  soft: {
    neutral: 'bg-sunk text-ink hover:brightness-95',
    primary: 'bg-accent-tint text-link hover:brightness-95',
    success: 'bg-good-tint text-good hover:brightness-95',
    danger: 'bg-alert-tint text-alert hover:brightness-95',
  },
  overlay: {
    neutral: 'bg-surface/90 text-ink shadow-sm hover:bg-surface',
    primary: 'bg-surface/90 text-link shadow-sm hover:bg-surface',
    success: 'bg-surface/90 text-good shadow-sm hover:bg-surface',
    danger: 'bg-surface/90 text-alert shadow-sm hover:bg-surface',
  },
}

export const Icon = ({
  as: As = 'button',
  variant = 'ghost',
  color = 'neutral',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...props
}) => (
  <As
    {...nativeProps(As, { type, disabled, loading })}
    aria-busy={loading || undefined}
    className={clsx(
      // shrink-0 keeps it circular inside a flex row that would squeeze it.
      'inline-flex shrink-0 items-center justify-center rounded-full',
      'transition-[background-color,color,transform,filter] duration-150',
      'active:translate-y-px disabled:pointer-events-none disabled:opacity-40',
      'aria-disabled:pointer-events-none aria-disabled:opacity-40',
      cursorFor(disabled, loading),
      ICON_VARIANTS[variant]?.[color] ?? ICON_VARIANTS.ghost.neutral,
      ICON_SIZES[size] ?? ICON_SIZES.md,
      className,
    )}
    {...props}
  >
    {loading ? <Spinner /> : children}
  </As>
)

// The namespace is assembled by whoever imports this, with `import * as
// Button`, rather than exported as an object from here. Same `Button.Action`
// at the call site, but the file exports nothing except components, which is
// the condition Fast Refresh needs to reload it without dropping state.
