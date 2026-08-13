import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button, Checkbox, Combobox, Input, Select, Textarea } from '../../ui'
import { useMeta } from '../../../context/meta'
import { notify } from '../../../utils/notify'
import shops from '../../../services/shops.services'

const Sell = () => {
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
      notify(`${shop.name} was created. Send it for review when it is ready.`, 'success')
      navigate('/dashboard')
    } catch {
      // Already reported by the response interceptor.
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-medium">Open your shop</h1>
      <p className="mt-1 text-sm text-plaza-muted">
        A shop is optional — you can sell under your own name. A shop is a brand, and Plaza reviews it before it opens.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="card mt-5 flex flex-col gap-5 p-6"
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
          rules={{ required: 'Accept the seller terms to open the shop.' }}
          render={({ field }) => (
            <Checkbox
              label="I accept the seller terms and the commission on each sale."
              checked={field.value}
              onChange={field.onChange}
              error={errors.terms?.message}
            />
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Open shop
          </Button>
          <Button variant="secondary" type="reset">
            Clear
          </Button>
        </div>
      </form>
    </div>
  )
}

export default Sell
