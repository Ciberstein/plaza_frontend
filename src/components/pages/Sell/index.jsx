import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button, Checkbox, Combobox, Input, Select, Textarea } from '../../ui'
import { useMeta } from '../../../context/meta'
import { notify } from '../../../utils/notify'
import shops from '../../../services/shops.services'

const Sell = () => {
  // The same lists the API validates against, so the form cannot offer a value
  // the server will refuse.
  const { categories, cities, shipping, ready } = useMeta()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      category: null,
      city: null,
      shipping: 'seller',
      description: '',
      terms: false,
    },
  })

  const onSubmit = async ({ terms, ...values }) => {
    void terms
    try {
      const shop = await shops.create(values)
      notify(`${shop.name} is ready. Publish it when you want it in the square.`, 'success')
      navigate('/dashboard')
    } catch {
      // Already reported by the response interceptor.
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight">Open your shop</h1>
      <p className="mt-1 text-sm text-plaza-mute">
        Five fields now, your first listing after that. You can change any of this later.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-5 rounded-plaza border border-plaza-line bg-plaza-paper p-5"
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
          name="category"
          control={control}
          rules={{ required: 'Pick the category most of your stock belongs to.' }}
          render={({ field }) => (
            <Select
              label="Main category"
              options={categories}
              value={field.value}
              onChange={field.onChange}
              placeholder={ready ? 'Pick a category' : 'Loading…'}
              disabled={!ready}
              hint="Shoppers browsing this category will see your shop."
              error={errors.category?.message}
            />
          )}
        />

        <Controller
          name="city"
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
              error={errors.city?.message}
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
          <Button variant="quiet" type="reset">
            Clear
          </Button>
        </div>
      </form>
    </div>
  )
}

export default Sell
