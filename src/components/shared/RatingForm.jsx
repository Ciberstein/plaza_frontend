import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Textarea } from '../ui'
import { Picker } from '../ui/Stars'
import { notify } from '../../utils/notify'
import ratings, { COMMENT_MAX } from '../../services/ratings.services'

/**
 * Leaving a rating, for a seller or for a listing.
 *
 * One control for both, because the act is the same and only what is being
 * judged changes. The words change with it: "how did it go with the seller"
 * and "what did you think" are different questions, and asking the second one
 * about a person would be asking something nobody means to answer.
 *
 * The warning that it cannot be undone sits above the button rather than in a
 * confirmation after it. A dialog that appears once the stars are already
 * chosen is asking about a decision that has been made; saying it beforehand
 * is what gives somebody the chance to think.
 */
const RatingForm = ({ target, subOrderId, productId, onDone, onCancel }) => {
  const { t } = useTranslation()
  const [stars, setStars] = useState(0)
  const [words, setWords] = useState('')
  const [busy, setBusy] = useState(false)

  const isSeller = target === 'seller'

  const submit = async (event) => {
    event.preventDefault()

    if (!stars) return notify(t('Ratings.Form.StarsRequired'), 'error')

    setBusy(true)
    try {
      const saved = isSeller
        ? await ratings.rateSeller(subOrderId, stars, words.trim() || undefined)
        : await ratings.reviewProduct(productId, stars, words.trim() || undefined)

      notify(isSeller ? t('Ratings.Form.SentSeller') : t('Ratings.Form.SentProduct'), 'success')
      onDone(saved)
    } catch {
      // Reported by the interceptor, which names the reason — already rated,
      // not received yet, not yours.
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-pz border border-line bg-sunk p-4">
      <div>
        <p className="text-sm font-medium text-ink">
          {isSeller ? t('Ratings.Form.SellerTitle') : t('Ratings.Form.ProductTitle')}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{t('Ratings.Form.Fixed')}</p>
      </div>

      <Picker value={stars} onChange={setStars} />

      <Textarea
        label={t('Ratings.Form.CommentLabel')}
        optional
        rows={3}
        maxLength={COMMENT_MAX}
        placeholder={
          isSeller ? t('Ratings.Form.SellerPlaceholder') : t('Ratings.Form.ProductPlaceholder')
        }
        value={words}
        onChange={event => setWords(event.target.value)}
      />

      <div className="flex flex-wrap justify-end gap-3">
        <Button.Action variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
          {t('Ratings.Form.Cancel')}
        </Button.Action>
        <Button.Action type="submit" size="sm" loading={busy}>
          {t('Ratings.Form.Submit')}
        </Button.Action>
      </div>
    </form>
  )
}

export default RatingForm
