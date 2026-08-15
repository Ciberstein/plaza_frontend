import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Link } from 'react-router-dom'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { Button, Textarea } from '../ui'
import { useAuth } from '../../context/auth'
import { useLanguage } from '../../context/language'
import { formatDate } from '../../utils/date'
import { notify } from '../../utils/notify'
import questions, { ANSWER_MAX, QUESTION_MAX } from '../../services/questions.services'
import { useResource } from '../../hooks/useResource'

// Shown only once it is nearly relevant. A counter that starts at "500 left"
// is a rule announced before anyone was going to break it.
const COUNTER_FROM = 80

const Counter = ({ used, max }) => {
  const { t } = useTranslation()
  const left = max - used

  if (left > COUNTER_FROM) return null

  return (
    <span className="tabular text-xs text-faint">{t('Questions.CharsLeft', { count: left })}</span>
  )
}

/**
 * One question, and the seller's answer under it.
 *
 * The answer hangs off the question on a short accent rule, and an unanswered
 * question has no rule at all — so whether something has been answered is read
 * from the shape of the block before any of the words are. The rule is the
 * brand colour because answering is the seller's act, and on this site every
 * colour has exactly one job.
 *
 * Nobody is named above the question. They are anonymous by design, not by
 * omission, which is why nothing here leaves a gap where an avatar would go.
 */
export const QuestionThread = ({ question, children }) => {
  const { t } = useTranslation()
  const { language } = useLanguage()

  return (
    <li className="border-t border-line pt-5 first:border-t-0 first:pt-0">
      <p className="text-[15px] leading-relaxed whitespace-pre-line text-ink">{question.body}</p>
      <p className="tabular mt-1.5 text-xs text-faint">
        {formatDate(question.createdAt, language)}
      </p>

      {question.answer ? (
        <div className="mt-3 border-l-2 border-accent pl-4">
          <p className="text-[15px] leading-relaxed whitespace-pre-line text-ink">
            {question.answer}
          </p>
          <p className="tabular mt-1.5 text-xs text-faint">
            {t('Questions.SellerLabel')} · {formatDate(question.answeredAt, language)}
          </p>
        </div>
      ) : children ? (
        // Whoever can answer gets the form in the place the answer will appear.
        <div className="mt-4">{children}</div>
      ) : (
        <span className="mt-3 inline-block rounded-pz-sm bg-info-tint px-2 py-1 text-[11px] font-semibold text-ink">
          {t('Questions.Waiting')}
        </span>
      )}
    </li>
  )
}

/**
 * The seller's one answer, wherever they happen to be looking at the question.
 *
 * The hint says the answer is public and that there is only one, because both
 * of those are things you cannot undo once the button is pressed.
 */
export const AnswerForm = ({ questionId, onAnswered }) => {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()

    const answer = value.trim()
    if (!answer) return notify(t('Questions.Answer.Required'), 'error')

    setBusy(true)
    try {
      const saved = await questions.answer(questionId, answer)
      setValue('')
      notify(t('Questions.Answer.Sent'), 'success')
      onAnswered(saved)
    } catch {
      // Reported by the interceptor.
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Textarea
        label={t('Questions.Answer.Label')}
        rows={3}
        maxLength={ANSWER_MAX}
        placeholder={t('Questions.Answer.Placeholder')}
        hint={t('Questions.Answer.Hint')}
        value={value}
        onChange={event => setValue(event.target.value)}
      />

      <div className="flex items-center justify-end gap-3">
        <Counter used={value.length} max={ANSWER_MAX} />
        <Button.Action type="submit" size="sm" loading={busy}>
          {t('Questions.Answer.Submit')}
        </Button.Action>
      </div>
    </form>
  )
}

/** Asking. Only ever shown to someone signed in who is not the seller. */
const AskForm = ({ productId, onAsked }) => {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()

    const body = value.trim()
    if (!body) return notify(t('Questions.Form.Required'), 'error')

    setBusy(true)
    try {
      const asked = await questions.ask(productId, body)
      setValue('')
      notify(t('Questions.Form.Sent'), 'success')
      onAsked(asked)
    } catch {
      // Reported by the interceptor.
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Textarea
        label={t('Questions.Form.Label')}
        rows={3}
        maxLength={QUESTION_MAX}
        placeholder={t('Questions.Form.Placeholder')}
        hint={t('Questions.Form.Hint')}
        value={value}
        onChange={event => setValue(event.target.value)}
      />

      <div className="flex items-center justify-end gap-3">
        <Counter used={value.length} max={QUESTION_MAX} />
        <Button.Action type="submit" size="sm" loading={busy}>
          {t('Questions.Form.Submit')}
        </Button.Action>
      </div>
    </form>
  )
}

/** A quiet line where the form would be, for whoever cannot use it. */
const Aside = ({ children }) => (
  <p className="rounded-pz border border-line bg-sunk px-4 py-3 text-sm text-muted">{children}</p>
)

const Modal = ({ open, onClose, product, rows, mine, onChange }) => {
  const { t } = useTranslation()
  const { account } = useAuth()

  return (
    <Dialog open={open} onClose={onClose} className="relative z-100">
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]" aria-hidden />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-pz border border-line bg-surface shadow-[0_24px_60px_-15px_hsl(var(--pz-shadow)/0.45)] duration-150 ease-pz data-closed:scale-95 data-closed:opacity-0"
        >
          <header className="flex items-start justify-between gap-4 border-b border-line p-6 pb-4">
            <div className="min-w-0">
              <DialogTitle className="font-display text-lg font-semibold text-ink">
                {t('Questions.Title')}
              </DialogTitle>
              <p className="mt-0.5 truncate text-sm text-muted">{product.title}</p>
            </div>

            <Button.Icon size="sm" onClick={onClose} aria-label={t('Questions.Close')}>
              <XMarkIcon className="size-5" />
            </Button.Icon>
          </header>

          {/* The panel scrolls, not the page behind it: a long list of
              questions must not push the ask box out of reach. */}
          <div className="flex min-h-0 grow flex-col gap-6 overflow-y-auto p-6">
            {mine ? (
              <Aside>{t('Questions.Form.OwnListing')}</Aside>
            ) : account ? (
              <div className="flex flex-col gap-3">
                <AskForm productId={product.id} onAsked={asked => onChange([asked, ...rows])} />
                <p className="text-xs leading-relaxed text-faint">{t('Questions.Anonymous')}</p>
              </div>
            ) : (
              <Aside>
                <Link
                  to="/access"
                  state={{ from: `/p/${product.id}` }}
                  className="font-medium text-link hover:underline"
                >
                  {t('Questions.Form.SignIn')}
                </Link>
              </Aside>
            )}

            {rows.length > 0 && (
              <ul className="flex flex-col gap-5">
                {rows.map(question => (
                  <QuestionThread key={question.id} question={question}>
                    {mine && (
                      <AnswerForm
                        questionId={question.id}
                        onAnswered={saved =>
                          onChange(rows.map(row => (row.id === saved.id ? saved : row)))
                        }
                      />
                    )}
                  </QuestionThread>
                ))}
              </ul>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

/**
 * Questions on a listing: a count on the page, the questions themselves behind
 * a button.
 *
 * Nothing anyone asked is quoted out here. The page is for the goods, and a
 * question pulled onto it is one shopper's concern given the same weight as
 * the description. What the section does say is how many were asked and how
 * many were answered, which is the thing a buyer actually wants to know before
 * bothering to type: a seller who has answered nine of nine is worth asking,
 * and one who has answered none of six has told you something too.
 */
const Questions = ({ product }) => {
  const { t } = useTranslation()
  const { account } = useAuth()

  const load = useCallback(() => questions.onProduct(product.id), [product.id])
  const { data } = useResource(load, String(product.id))

  const [list, setList] = useState(null)
  const [open, setOpen] = useState(false)

  const rows = list ?? data ?? []
  const answered = rows.filter(row => row.answer).length

  // Both sides can be undefined, and in JavaScript that compares equal.
  const mine = Boolean(account?.id) && account.id === product.seller?.id

  return (
    <section className="mt-10 border-t border-line pt-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">{t('Questions.Title')}</h2>

          <p className="mt-1 text-sm text-muted">
            {rows.length === 0
              ? `${t('Questions.None')} · ${t('Questions.NoneHint')}`
              : `${t('Questions.Count', { count: rows.length })} · ${t('Questions.AnsweredCount', { count: answered })}`}
          </p>
        </div>

        {/* One button. It opens the same panel either way, and the summary
            beside it already says how many are in there. */}
        <Button.Action
          variant="outline"
          color="neutral"
          size="sm"
          onClick={() => setOpen(true)}
        >
          {rows.length === 0 ? t('Questions.Ask') : t('Questions.Open')}
        </Button.Action>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        product={product}
        rows={rows}
        mine={mine}
        onChange={setList}
      />
    </section>
  )
}

export default Questions
