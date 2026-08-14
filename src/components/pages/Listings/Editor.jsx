import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, StarIcon, TrashIcon } from '@heroicons/react/20/solid'
import { Button, Combobox, Input, Select, Textarea } from '../../ui'
import { useMeta } from '../../../context/meta'
import { notify } from '../../../utils/notify'
import products from '../../../services/products.services'
import shops from '../../../services/shops.services'

const MAX_MB = 5

/**
 * The photographs of a listing.
 *
 * Only reachable once the listing exists, which is why creating one saves first
 * and comes back here: there is nowhere to attach a file to a row that has not
 * been written yet.
 *
 * Ordering is a "make this the cover" action rather than drag and drop. The
 * only position anyone actually cares about is the first one, and dragging is
 * the interaction most likely to be impossible on a phone.
 */
const Photos = ({ product, onChange }) => {
  const fileInput = useRef(null)
  const [busy, setBusy] = useState(false)
  const images = product.images ?? []

  const pick = async (event) => {
    const file = event.target.files?.[0]
    // Cleared straight away so picking the same file twice still fires.
    event.target.value = ''
    if (!file) return

    if (file.size > MAX_MB * 1024 * 1024) {
      return notify(`That image is over ${MAX_MB} MB. Use a smaller one.`, 'error')
    }

    setBusy(true)
    try {
      onChange(await products.addImage(product.id, file))
    } catch {
      // Reported by the interceptor.
    } finally {
      setBusy(false)
    }
  }

  const remove = async (imageId) => {
    setBusy(true)
    try {
      onChange(await products.removeImage(product.id, imageId))
    } catch {
      // Reported by the interceptor.
    } finally {
      setBusy(false)
    }
  }

  const makeCover = async (imageId) => {
    setBusy(true)
    try {
      const order = [imageId, ...images.filter(i => i.id !== imageId).map(i => i.id)]
      onChange(await products.reorderImages(product.id, order))
    } catch {
      // Reported by the interceptor.
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel p-6 sm:p-7">
      <h2 className="font-display text-lg font-semibold text-ink">Photos</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        The first one is the cover, and it is the only one most people will ever see.
        Up to 8.
      </p>

      {images.length > 0 && (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id} className="group relative overflow-hidden rounded-pz border border-line">
              <img src={image.url} alt="" className="aspect-square w-full object-cover" />

              {index === 0 && (
                <span className="absolute top-1.5 left-1.5 rounded-pz-sm bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-on-accent">
                  Cover
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                {index !== 0 && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => makeCover(image.id)}
                    aria-label="Make this the cover"
                    className="rounded-pz-sm bg-white/90 p-1.5 text-ink transition hover:bg-white disabled:opacity-50"
                  >
                    <StarIcon className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(image.id)}
                  aria-label="Remove this photo"
                  className="rounded-pz-sm bg-white/90 p-1.5 text-alert transition hover:bg-white disabled:opacity-50"
                >
                  <TrashIcon className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5">
        <Button
          variant="outline"
          size="sm"
          loading={busy}
          disabled={images.length >= 8}
          onClick={() => fileInput.current?.click()}
        >
          {images.length ? 'Add another photo' : 'Upload the first photo'}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={pick}
          className="sr-only"
          tabIndex={-1}
        />
      </div>
    </section>
  )
}

const Editor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { categories, cities, ready } = useMeta()

  const [product, setProduct] = useState(null)
  const [mine, setMine] = useState([])
  const [loading, setLoading] = useState(Boolean(id))

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: '', description: '', price: '', stock: 1,
      categoryId: null, cityId: null, shopId: '',
    },
  })

  // Only shops this person holds, because selling under a brand is the one
  // thing on this form that is not theirs to type.
  useEffect(() => {
    let ignore = false
    shops.mine().then(data => { if (!ignore) setMine(data) }).catch(() => {})
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    if (!id) return
    let ignore = false

    products
      .get(id)
      .then(data => {
        if (ignore) return
        setProduct(data)
        reset({
          title: data.title,
          description: data.description ?? '',
          price: String(data.price ?? ''),
          stock: data.stock,
          categoryId: data.categoryId,
          cityId: data.cityId,
          shopId: data.shopId ?? '',
        })
      })
      .catch(() => { if (!ignore) navigate('/listings', { replace: true }) })
      .finally(() => { if (!ignore) setLoading(false) })

    return () => { ignore = true }
  }, [id, reset, navigate])

  // A parent and its children in one list, the children marked with the aisle
  // they belong to. A seller thinks "wool blanket", not "Home, then Bedding".
  const categoryOptions = useMemo(
    () =>
      categories.flatMap(parent => [
        { value: parent.value, label: parent.label },
        ...(parent.children ?? []).map(child => ({
          value: child.value,
          label: child.label,
          subtitle: parent.label,
        })),
      ]),
    [categories],
  )

  const shopOptions = useMemo(
    () => [
      { value: '', label: 'Under my own name', subtitle: 'Your username and photo' },
      ...mine.map(shop => ({
        value: shop.id,
        label: shop.name,
        subtitle: shop.status === 'active' ? 'Open' : `${shop.status} — cannot publish yet`,
      })),
    ],
    [mine],
  )

  const save = async (values) => {
    const payload = {
      ...values,
      stock: Number(values.stock),
      shopId: values.shopId === '' ? null : values.shopId,
    }

    try {
      if (id) {
        setProduct(await products.update(id, payload))
        return notify('Listing saved.', 'success')
      }

      const created = await products.create(payload)
      notify('Listing saved. Add its photos to publish it.', 'success')
      // Straight to the edit screen, which is the only place photos can be
      // attached, and photos are what publishing is waiting on.
      navigate(`/listings/${created.id}`, { replace: true })
    } catch {
      // Reported by the interceptor.
    }
  }

  const publish = async () => {
    try {
      setProduct(await products.publish(id))
      notify('Your listing is live.', 'success')
    } catch {
      // The interceptor shows the list of what is still missing.
    }
  }

  if (loading) {
    return (
      <div className="shell py-8 sm:py-12" aria-hidden>
        <div className="mx-auto max-w-xl">
          <div className="h-8 w-56 animate-pulse rounded-full bg-sunk" />
          <div className="panel mt-7 h-96 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="shell py-8 sm:py-12">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div>
          <Link
            to="/listings"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            <ArrowLeftIcon className="size-4" />
            Your listings
          </Link>

          <h1 className="rule-accent mt-5 font-display text-3xl font-bold tracking-tight text-ink">
            {id ? 'Edit listing' : 'List an item'}
          </h1>
        </div>

        <form onSubmit={handleSubmit(save)} className="panel flex flex-col gap-6 p-6 sm:p-7">
          <Input
            label="Title"
            placeholder="Handwoven wool blanket"
            hint="What it is, in the words someone would search for."
            error={errors.title?.message}
            {...register('title', {
              required: 'Give the listing a title.',
              minLength: { value: 3, message: 'Use at least 3 characters.' },
            })}
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <Input
              label="Price"
              prefix="$"
              inputMode="decimal"
              placeholder="180000"
              error={errors.price?.message}
              {...register('price', {
                required: 'Set a price.',
                pattern: { value: /^\d{1,10}(\.\d{1,2})?$/, message: 'Numbers only, like 180000.' },
              })}
            />

            <Input
              label="Stock"
              inputMode="numeric"
              hint="At zero it stays listed but nobody can buy."
              error={errors.stock?.message}
              {...register('stock', {
                required: 'Say how many you have.',
                min: { value: 0, message: 'Zero or more.' },
              })}
            />
          </div>

          <Controller
            name="categoryId"
            control={control}
            rules={{ required: 'Pick the aisle it belongs in.' }}
            render={({ field }) => (
              <Combobox
                label="Category"
                options={categoryOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder={ready ? 'Start typing a category' : 'Loading…'}
                disabled={!ready}
                emptyMessage="No category by that name."
                error={errors.categoryId?.message}
              />
            )}
          />

          <Controller
            name="cityId"
            control={control}
            rules={{ required: 'We need to know where it ships from.' }}
            render={({ field }) => (
              <Combobox
                label="Ships from"
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
            name="shopId"
            control={control}
            render={({ field }) => (
              <Select
                label="Sold as"
                options={shopOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Textarea
            label="Description"
            optional
            rows={4}
            placeholder="Wool from Nariño, woven on a pedal loom. 180 by 130 cm."
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="flex flex-wrap gap-3 border-t border-line pt-6">
            <Button type="submit" loading={isSubmitting}>
              {id ? 'Save changes' : 'Save and add photos'}
            </Button>
            {product && product.status !== 'active' && (
              <Button type="button" variant="outline" onClick={publish}>
                Publish
              </Button>
            )}
          </div>
        </form>

        {/* Absent while creating, because there is no row to attach a file to
            until the listing has been saved once. */}
        {product && <Photos product={product} onChange={setProduct} />}
      </div>
    </div>
  )
}

export default Editor
