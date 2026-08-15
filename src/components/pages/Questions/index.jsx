import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PhotoIcon } from '@heroicons/react/24/outline'
import { Button } from '../../ui'
import { AnswerForm, QuestionThread } from '../../shared/Questions'
import questions from '../../../services/questions.services'
import { useResource } from '../../../hooks/useResource'

/** The listing a question was asked about, small enough to sit above it. */
const Listing = ({ product }) => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-3">
      {product.cover ? (
        <img
          src={product.cover}
          alt=""
          className="size-11 shrink-0 rounded-pz-sm border border-line bg-sunk object-cover"
        />
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-pz-sm border border-line bg-sunk text-faint">
          <PhotoIcon className="size-5" />
        </span>
      )}

      <span className="min-w-0">
        <Link
          to={`/p/${product.id}`}
          className="block truncate font-medium text-ink transition-colors hover:text-link"
        >
          {product.title}
        </Link>
        <span className="block text-xs text-faint">{t('Questions.Inbox.OpenListing')}</span>
      </span>
    </div>
  )
}

const Group = ({ rows, onAnswered, answerable }) => (
  <ul className="mt-4 flex flex-col gap-3">
    {rows.map(question => (
      <li key={question.id} className="panel p-5 sm:p-6">
        <Listing product={question.product} />

        <ul className="mt-4 border-t border-line pt-4">
          <QuestionThread question={question}>
            {answerable && (
              <AnswerForm questionId={question.id} onAnswered={onAnswered} />
            )}
          </QuestionThread>
        </ul>
      </li>
    ))}
  </ul>
)

/**
 * Everything people have asked this seller.
 *
 * Split rather than sorted into one run: what is waiting is the reason to open
 * this screen, and burying two unanswered questions among forty answered ones
 * makes the screen a list instead of a job. The answered ones stay below,
 * because "what did I already tell them?" is the other question this page gets
 * asked, and going to look for it on the listing is a worse answer.
 */
const Questions = () => {
  const { t } = useTranslation()

  const load = useCallback(() => questions.inbox(), [])
  const { data, loading } = useResource(load, 'inbox')

  const [list, setList] = useState(null)
  const rows = list ?? data ?? []

  const waiting = rows.filter(row => !row.answer)
  const answered = rows.filter(row => row.answer)

  // The answer comes back without the listing it was asked about, so the row
  // is updated rather than replaced.
  const onAnswered = (saved) =>
    setList(rows.map(row => (row.id === saved.id ? { ...row, ...saved } : row)))

  if (loading && !list) {
    return (
      <div className="shell py-8 sm:py-10" aria-hidden>
        <div className="h-9 w-48 animate-pulse rounded-full bg-sunk" />
        <div className="panel mt-8 h-44 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="shell py-8 sm:py-10">
      <h1 className="rule-accent font-display text-3xl font-bold tracking-tight text-ink">
        {t('Questions.Inbox.Title')}
      </h1>

      {rows.length === 0 ? (
        <div className="panel mt-8 flex flex-col items-center gap-4 px-6 py-16 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">
            {t('Questions.Inbox.Empty.Title')}
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            {t('Questions.Inbox.Empty.Body')}
          </p>
          <Button.Action as={Link} to="/listings" variant="outline" color="neutral" size="sm" className="mt-1">
            {t('Header.Account.YourListings')}
          </Button.Action>
        </div>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted">
            {waiting.length > 0
              ? t('Questions.Inbox.Waiting', { count: waiting.length })
              : t('Questions.Inbox.AllAnswered')}
          </p>

          {waiting.length > 0 && (
            <section className="mt-8">
              <Group rows={waiting} onAnswered={onAnswered} answerable />
            </section>
          )}

          {answered.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-lg font-semibold text-ink">
                {t('Questions.Inbox.AnsweredSection')}
              </h2>
              <Group rows={answered} onAnswered={onAnswered} />
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default Questions
