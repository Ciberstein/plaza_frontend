import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import { Button, Checkbox, Combobox, Input, Select, Textarea } from '../../ui'
import { useMeta } from '../../../context/meta'
import { notify } from '../../../utils/notify'
import shops from '../../../services/shops.services'

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
  // The same lists the API validates against, so the form cannot offer a value
  // the server will refuse.
  const { cities, shipping, ready } = useMeta()
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
      notify(`${shop.name} was saved. Send it for review when it is ready.`, 'success')
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
          Selling on Plaza
        </Link>

        <h1 className="rule-accent mt-5 font-display text-3xl font-bold tracking-tight text-ink">
          Request a shop
        </h1>
        <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-muted">
          You do not need a shop to sell. A shop gives what you sell its own name, logo
          and storefront, and Plaza reviews every request before it opens.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="panel mt-7 flex flex-col gap-6 p-6 sm:p-7"
        >
          <Input
            label="Shop name"
            placeholder="Tejidos del Sur"
            hint="This is the name buyers see on every listing."
            error={errors.name?.message}
            {...register('name', {
              required: 'Give the shop a name buyers will recognise.',
              minLength: { value: 3, message: 'Use at least 3 characters.' },
            })}
          />

          <Controller
            name="cityId"
            control={control}
            rules={{ required: 'We need a city to estimate delivery times.' }}
            render={({ field }) => (
              <Combobox
                label="City"
                options={cities}
                value={field.value}
                onChange={field.onChange}
                placeholder={ready ? 'Start typing a city' : 'Loading…'}
                disabled={!ready}
                emptyMessage="No city by that name. Try the department instead."
                error={errors.cityId?.message}
              />
            )}
          />

          <Controller
            name="shipping"
            control={control}
            render={({ field }) => (
              <Select
                label="How orders get delivered"
                options={shipping}
                value={field.value}
                onChange={field.onChange}
                disabled={!ready}
              />
            )}
          />

          <Textarea
            label="What you sell"
            optional
            rows={3}
            placeholder="Handwoven bags and blankets, made in Nariño."
            error={errors.description?.message}
            {...register('description', {
              maxLength: { value: 300, message: 'Keep it under 300 characters.' },
            })}
          />

          <Controller
            name="terms"
            control={control}
            rules={{ required: 'Accept the seller terms to request a shop.' }}
            render={({ field }) => (
              <Checkbox
                label="I accept the seller terms and the commission on each sale."
                checked={field.value}
                onChange={field.onChange}
                error={errors.terms?.message}
              />
            )}
          />

          <div className="flex flex-wrap gap-3 border-t border-line pt-6">
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Save request
            </Button>
            <Button variant="ghost" type="reset">
              Clear the form
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ShopRequest
