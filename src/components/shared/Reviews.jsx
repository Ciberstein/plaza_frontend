import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '../ui'
import Stars from '../ui/Stars'
import { useLanguage } from '../../context/language'
import { formatDate } from '../../utils/date'
import ratings from '../../services/ratings.services'
import { useResource } from '../../hooks/useResource'

/**
 * What people who bought it thought.
 *
 * Named, unlike a question, whose author is hidden. The two look similar and
 * the reasoning runs opposite ways: a question is asked before any money moves
 * and anonymity is what makes it safe to ask, while a review carries weight
 * only because somebody put their name to it. A review nobody can be held to
 * is a review anybody can invent.
 *
 * Shown in full rather than behind a dialog, which is the other difference
 * from questions. A question is one shopper's concern; a review is the closest
 * thing a listing has to evidence, and burying it would be hiding the part a
 * buyer came to read.
 */
const Reviews = ({ product }) => {
  const { t } = useTranslation()
  const { language } = useLanguage()

  const load = useCallback(() => ratings.onProduct(product.id), [product.id])
  const { data } = useResource(load, String(product.id))

  const rows = data ?? []
  const isService = product.kind === 'service'

  return (
    <section className="mt-10 border-t border-line pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="font-display text-lg font-semibold text-ink">
          {isService ? t('Ratings.Reviews.TitleService') : t('Ratings.Reviews.Title')}
        </h2>

        {rows.length > 0 && (
          <span className="text-sm text-muted">
            {t('Ratings.ReviewCount', { count: rows.length })}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t('Ratings.Reviews.Empty')}{' '}
          <span className="text-faint">{t('Ratings.Reviews.OnlyBuyers')}</span>
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-5">
          {rows.map(review => (
            <li key={review.id} className="border-t border-line pt-5 first:border-t-0 first:pt-0">
              <div className="flex items-center gap-3">
                <Avatar account={review.author} size="sm" />

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {review.author?.username}
                  </p>
                  <span className="flex items-center gap-2">
                    <Stars value={review.stars} size="sm" />
                    <span className="tabular text-xs text-faint">
                      {formatDate(review.createdAt, language)}
                    </span>
                  </span>
                </div>
              </div>

              {review.body && (
                <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-ink">
                  {review.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default Reviews
