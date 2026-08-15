import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import Rating from '@mui/material/Rating'
import { StarIcon } from '@heroicons/react/20/solid'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'
import clsx from 'clsx'

const MAX = 5

const SIZES = {
  sm: 'size-3.5',
  md: 'size-4.5',
  lg: 'size-7',
}

/**
 * Stars, read or given.
 *
 * Built on Material UI's `Rating`, wearing Plaza's own icons and colours. What
 * it is used for is the accessibility and the partial fill, not the look: the
 * control underneath is a radio group with real text labels, so a person
 * hearing the page gets one control with five options and arrow keys that
 * work, rather than five buttons they have to infer an order from. Reproducing
 * that by hand is possible and was the first attempt; keeping it correct
 * afterwards is the part a library is actually for.
 *
 * Everything visible is overridden. `icon` and `emptyIcon` are the same
 * Heroicons the rest of the app draws with, sized by the same Tailwind scale,
 * and the colours come from the same tokens — so nothing here inherits
 * Material's typography, its ripple, or its palette.
 *
 * They are drawn in the marigold that elsewhere means "waiting on you", which
 * is the one place this palette's rule of one colour per job is bent, and
 * deliberately: a star is gold everywhere anyone has ever seen one, and a blue
 * one reads as a bug rather than as a brand. The shape keeps them apart —
 * "waiting" is always a filled chip with ink on top, and a star is always a
 * glyph on the page's own ground.
 */
const iconFor = (size, className) => (
  <StarIcon className={clsx(SIZES[size] ?? SIZES.md, 'text-info', className)} />
)

const emptyFor = (size) => (
  <StarOutline className={clsx(SIZES[size] ?? SIZES.md, 'text-line-strong')} />
)

// MUI sizes its own icons by font-size and lays them out with its own spacing.
// Both are replaced: the glyphs carry Tailwind size classes, and the gap is set
// here so a row of stars measures the same as any other row of icons on the
// page.
const layout = { gap: '2px', '& .MuiRating-icon': { color: 'inherit' } }

/**
 * A rating somebody already left.
 *
 * Read-only, and filled to the tenth. This is the one thing hand-rolling got
 * worse: an average of 4.3 drawn as four whole stars throws away the very
 * detail that separates a 4.3 seller from a 3.8 one. Here the fourth star is
 * filled three-tenths of the way, and the number is printed beside it for
 * anyone the fraction is too fine for — which is also what keeps this legible
 * when colour is the only thing distinguishing full from empty.
 */
export const Score = ({ average, count, size = 'md', showCount = true, className }) => {
  const { t } = useTranslation()

  if (!count) {
    return <span className={clsx('text-sm text-faint', className)}>{t('Ratings.None')}</span>
  }

  return (
    <span className={clsx('flex items-center gap-1.5', className)}>
      {/* The label belongs to the Rating and not to a wrapper around it.
          MUI puts `role="img"` with its own aria-label on the root, so a
          second label outside would be announced twice — and MUI's default
          says "4.3 Stars" in English whatever language the page is in. The
          count is not repeated into it: it is printed beside the stars, and a
          screen reader reads that text like any other. */}
      <Rating
        readOnly
        value={Number(average)}
        max={MAX}
        precision={0.1}
        getLabelText={stars => t('Ratings.StarsAria', { stars, max: MAX })}
        icon={iconFor(size)}
        emptyIcon={emptyFor(size)}
        sx={layout}
      />
      <span className="tabular text-sm font-medium text-ink">{average}</span>
      {showCount && (
        <span className="text-sm text-muted">({t('Ratings.Count', { count })})</span>
      )}
    </span>
  )
}

/**
 * Choosing a rating.
 *
 * Whole stars only: `precision` is left at one because "three and a half out
 * of five" is a distinction nobody means to draw when they are asked how it
 * went, and offering it makes the control harder to hit for an answer nobody
 * wanted to give.
 *
 * `name` has to be unique on the page — it is what binds the five inputs into
 * one group, and two pickers sharing it would be one control.
 */
export const Picker = ({ value, onChange, size = 'lg', className }) => {
  const { t } = useTranslation()
  const name = useId()

  return (
    <Rating
      name={name}
      // null rather than 0: MUI reads zero as "the empty option is chosen",
      // which checks a radio nobody picked.
      value={value || null}
      max={MAX}
      onChange={(_event, next) => onChange(next ?? 0)}
      // What a screen reader announces for each option. Translated, because
      // MUI's default says "3 Stars" in English whatever the page is in.
      getLabelText={stars => t('Ratings.PickStars', { stars, max: MAX })}
      icon={iconFor(size, 'transition-transform')}
      emptyIcon={emptyFor(size)}
      className={className}
      sx={{
        ...layout,
        '& .MuiRating-iconHover': { transform: 'scale(1.1)' },
      }}
    />
  )
}

/** The plain row, for a rating shown inside something else. */
const Stars = ({ value, size = 'md', className }) => {
  const { t } = useTranslation()

  return (
    <Rating
      readOnly
      value={Number(value)}
      max={MAX}
      getLabelText={stars => t('Ratings.StarsAria', { stars, max: MAX })}
      icon={iconFor(size)}
      emptyIcon={emptyFor(size)}
      className={className}
      sx={layout}
    />
  )
}

export default Stars
