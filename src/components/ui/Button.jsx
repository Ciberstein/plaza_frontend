import clsx from 'clsx'

// The amber fill is the action, and it takes dark text rather than white.
// Amber is a light colour, and a page whose every button was a dark slab is
// what made the last palette feel heavy. `secondary` is the same amber pulled
// back to a tint, which is what a marketplace needs for the two actions it
// shows together, where both are wanted but only one is the main path.
const VARIANTS = {
  primary: 'bg-accent text-on-accent border-transparent hover:bg-accent-deep',
  secondary: 'bg-accent-tint text-link border-transparent hover:bg-accent-tint/60',
  outline: 'bg-transparent text-ink border-line-strong hover:border-ink hover:bg-sunk',
  danger: 'bg-alert text-on-alert border-transparent hover:brightness-110',
  ghost: 'bg-transparent text-link border-transparent hover:bg-accent-tint',
}

const SIZES = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
}

/**
 * `as` lets the same button carry a route change — a call to action is often a
 * link, and a link that looks like a button still has to open in a new tab on
 * middle click. Rendering a real anchor is the only way to keep that.
 */
const Button = ({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  full = false,
  loading = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...props
}) => (
  <Component
    {...(Component === 'button'
      ? { type, disabled: disabled || loading }
      : { 'aria-disabled': disabled || loading || undefined })}
    aria-busy={loading || undefined}
    className={clsx(
      'inline-flex shrink-0 items-center justify-center gap-2 rounded-pz-sm border',
      'font-medium whitespace-nowrap transition-[background-color,border-color,transform,filter] duration-150',
      // The press is a single pixel of travel. It is the cheapest way to make a
      // control feel like it was pushed rather than merely repainted.
      'active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
      VARIANTS[variant] ?? VARIANTS.primary,
      SIZES[size] ?? SIZES.md,
      full && 'w-full',
      className,
    )}
    {...props}
  >
    {loading && (
      <span
        aria-hidden
        className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
    )}
    {children}
  </Component>
)

export default Button
