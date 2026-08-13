import clsx from 'clsx'

// One blue carries every action. `primary` is the solid one, `secondary` the
// same blue on a tint — that pairing is what marketplaces use for "buy now" and
// "add to cart", where both are wanted but only one is the main path.
const VARIANTS = {
  primary: 'bg-plaza-action text-white hover:bg-plaza-action-deep border-transparent',
  secondary: 'bg-plaza-action-tint text-plaza-action hover:bg-plaza-action-tint/70 border-transparent',
  outline: 'bg-plaza-surface text-plaza-action border-plaza-action hover:bg-plaza-action-tint',
  danger: 'bg-plaza-alert text-white hover:bg-plaza-alert/85 border-transparent',
  ghost: 'bg-transparent text-plaza-action border-transparent hover:bg-plaza-action-tint',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
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
      'inline-flex items-center justify-center gap-2 rounded-plaza border font-medium',
      'transition-colors disabled:cursor-not-allowed disabled:opacity-55',
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
