import clsx from 'clsx'

// Two levels of emphasis, so the strongest one keeps its meaning. `accent` is
// reserved for the single action that completes a purchase; `primary` carries
// everything else that submits. A screen with two marigold buttons has no
// primary action at all.
const VARIANTS = {
  accent: 'bg-plaza-marigold text-plaza-ink hover:bg-plaza-marigold/85 border-transparent',
  primary: 'bg-plaza-pine text-plaza-paper hover:bg-plaza-pine-soft border-transparent',
  quiet: 'bg-plaza-paper text-plaza-pine border-plaza-line hover:border-plaza-pine',
  danger: 'bg-plaza-clay text-plaza-paper hover:bg-plaza-clay/85 border-transparent',
  ghost: 'bg-transparent text-plaza-pine border-transparent hover:bg-plaza-pine/8',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

/**
 * `as` lets the same button carry a route change — the hero CTA is a link, and a
 * link that looks like a button still has to open in a new tab on middle click.
 * Rendering a real anchor is the only way to keep that.
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
