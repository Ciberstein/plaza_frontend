import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import { Button, Checkbox, Combobox, Input, Select, Textarea } from '../../ui'
import { useMeta } from '../../../context/meta'
import { notify } from '../../../utils/notify'
import shops from '../../../services/shops.services'
import { withShopShippingLabels } from '../../../utils/vocabulary'

/**
 * Requesting a shop.
 *
 * On its own route rather than on the selling page, because a shop is not how
 * you sell on Plaza — it is a brand you may be granted to sell under. Anything
 * that put this form in front of someone who only wanted to list an item was
 * advertising the exception as if it were the rule.
 *
 * Saving does not open anything. It creates a draft the seller can still edit,
 * and sending it for review is a deliberate second action from the dashboard.
 */
const ShopRequest = () => {
  const { t } = useTranslation()
  // The same lists the API validates against, so the form cannot offer a value
  // the server will refuse.
  const { cities, shipping: rawShipping, ready } = useMeta()
  const shipping = withShopShippingLabels(t, rawShipping)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      cityId: null,
      shipping: 'seller',
      description: '',
      terms: false,
    },
  })

  const onSubmit = async ({ terms, ...values }) => {
    void terms
    try {
      const shop = await shops.create(values)
      notify(t('ShopRequest.Saved', { name: shop.name }), 'success')
      navigate('/dashboard')
    } catch {
      // Already reported by the response interceptor.
    }
  }

  return (
    <div className="shell py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <Link
          to="/sell"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeftIcon className="size-4" />
          {t('ShopRequest.BackLink')}
        </Link>

        <h1 className="rule-accent mt-5 font-display text-3xl font-bold tracking-tight text-ink">
          {t('ShopRequest.Title')}
        </h1>
        <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-muted">
          {t('ShopRequest.Intro')}
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="panel mt-7 flex flex-col gap-6 p-6 sm:p-7"
        >
          <Input
            label={t('ShopRequest.Name.Label')}
            placeholder="Tejidos del Sur"
            hint={t('ShopRequest.Name.Hint')}
            error={errors.name?.message}
            {...register('name', {
              required: t('ShopRequest.Name.Required'),
              minLength: { value: 3, message: t('ShopRequest.Name.MinLength') },
            })}
          />

          <Controller
            name="cityId"
            control={control}
            rules={{ required: t('ShopRequest.City.Required') }}
            render={({ field }) => (
              <Combobox
                label={t('ShopRequest.City.Label')}
                options={cities}
                value={field.value}
                onChange={field.onChange}
                placeholder={ready ? t('ShopRequest.City.StartTyping') : t('Common.Loading')}
                disabled={!ready}
                emptyMessage={t('ShopRequest.City.Empty')}
                error={errors.cityId?.message}
              />
            )}
          />

          <Controller
            name="shipping"
            control={control}
            render={({ field }) => (
              <Select
                label={t('ShopRequest.Shipping.Label')}
                options={shipping}
                value={field.value}
                onChange={field.onChange}
                disabled={!ready}
              />
            )}
          />

          <Textarea
            label={t('ShopRequest.Description.Label')}
            optional
            rows={3}
            placeholder={t('ShopRequest.Description.Placeholder')}
            error={errors.description?.message}
            {...register('description', {
              maxLength: { value: 300, message: t('ShopRequest.Description.MaxLength') },
            })}
          />

          <Controller
            name="terms"
            control={control}
            rules={{ required: t('ShopRequest.Terms.Required') }}
            render={({ field }) => (
              <Checkbox
                label={t('ShopRequest.Terms.Label')}
                checked={field.value}
                onChange={field.onChange}
                error={errors.terms?.message}
              />
            )}
          />

          <div className="flex flex-wrap gap-3 border-t border-line pt-6">
            <Button.Action type="submit" loading={isSubmitting}>
              {t('ShopRequest.Save')}
            </Button.Action>
            <Button.Action variant="ghost" type="reset">
              {t('ShopRequest.Clear')}
            </Button.Action>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ShopRequest
