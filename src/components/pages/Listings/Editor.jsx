import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/20/solid'
import { Accordion, Button, Checkbox, Combobox, Confirm, Input, Select, Textarea } from '../../ui'
import { errorClass, labelClass } from '../../ui/styles'
import { useMeta } from '../../../context/meta'
import { formatMoney } from '../../../utils/money'
import { notify } from '../../../utils/notify'
import products from '../../../services/products.services'
import shops from '../../../services/shops.services'

const MAX_MB = 5
const MAX_PHOTOS = 8

// What a shop's single delivery mode means for a listing sold under it. Only a
// starting point: the seller changes it per item, which is the whole reason
// delivery lives on the product and not only on the shop.
const SHOP_DEFAULT = {
  seller: ['shipping'],
  plaza: ['shipping'],
  pickup: ['door_pickup'],
}

/**
 * The photographs of a listing.
 *
 * Nothing uploads while you pick it. Files sit here as local previews and go up
 * when the form is submitted, so choosing six photos and then changing your
 * mind costs nothing and leaves nothing behind in Cloudinary.
 *
 * Photos already on the server are a different matter: removing one of those,
 * or making it the cover, happens immediately, because it is already real.
 */
/** One photograph, draggable. */
const Tile = ({ tile, cover, busy }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tile.key })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={clsx(
        'group relative size-28 cursor-grab touch-none overflow-hidden rounded-pz border',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        isDragging ? 'z-10 border-accent opacity-90 shadow-lg' : 'border-line',
      )}
      {...attributes}
      {...listeners}
    >
      <img src={tile.url} alt="" className="pointer-events-none size-full object-cover" />

      {/* Always reachable on a touch screen, out of the way on a pointer one
          until the photo is actually being considered. */}
      <span className="absolute top-1 right-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <Button.Icon
          variant="overlay" color="danger" size="sm" disabled={busy}
          onClick={tile.remove}
          aria-label="Remove this photo"
        >
          <TrashIcon className="size-4" />
        </Button.Icon>
      </span>

      {/* One bar, and "not saved" wins the slot. A photo the seller believes is
          stored and is not is the more urgent fact. */}
      {tile.pending ? (
        <span className="absolute inset-x-0 bottom-0 bg-info py-1 text-center text-[10px] font-bold tracking-wide text-on-info uppercase">
          Not saved
        </span>
      ) : cover ? (
        <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-1 text-center text-[10px] font-bold tracking-wide text-ground uppercase">
          Cover
        </span>
      ) : null}
    </li>
  )
}

/**
 * The photographs, arranged by dragging.
 *
 * Order is part of what gets saved, alongside the files themselves: a queued
 * photo cannot be put in front of a stored one until it exists, so the whole
 * arrangement is applied once, after the uploads, when the ids are known.
 *
 * dnd-kit rather than pointer maths, and specifically for its keyboard sensor.
 * Reordering that only works with a mouse is a feature some people simply do
 * not have, and it would have replaced a button that worked for everyone.
 */
const Photos = ({ tiles, onQueue, onReorder, busy }) => {
  const fileInput = useRef(null)
  const total = tiles.length

  const sensors = useSensors(
    // A few pixels of travel before a drag begins, so that clicking the remove
    // button on top of a tile stays a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const pick = (event) => {
    const files = Array.from(event.target.files ?? [])
    // Cleared straight away so picking the same file twice still fires.
    event.target.value = ''
    if (!files.length) return

    const room = MAX_PHOTOS - total
    if (room <= 0) return notify(`A listing holds ${MAX_PHOTOS} photos.`, 'error')

    const tooBig = files.filter(file => file.size > MAX_MB * 1024 * 1024)
    if (tooBig.length) notify(`Skipped ${tooBig.length} over ${MAX_MB} MB.`, 'error')

    const accepted = files.filter(file => file.size <= MAX_MB * 1024 * 1024).slice(0, room)
    if (files.length > room) notify(`Only ${room} more will fit.`, 'error')

    onQueue(accepted.map(file => ({
      key: `q-${crypto.randomUUID()}`,
      file,
      url: URL.createObjectURL(file),
    })))
  }

  const dropped = ({ active, over }) => {
    if (!over || active.id === over.id) return

    const keys = tiles.map(tile => tile.key)
    const from = keys.indexOf(active.id)
    const to = keys.indexOf(over.id)

    if (from !== -1 && to !== -1) onReorder(arrayMove(keys, from, to))
  }

  return (
    <div>
      <p className="text-sm leading-relaxed text-muted">
        Drag to arrange them. The first one is the cover, and it is the only one most
        people will ever see. Up to {MAX_PHOTOS}, and at least one to publish.
        They upload when you save.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dropped}>
        <SortableContext items={tiles.map(tile => tile.key)} strategy={rectSortingStrategy}>
          <ul className="mt-4 flex flex-wrap gap-3">
            {tiles.map((tile, index) => (
              <Tile key={tile.key} tile={tile} cover={index === 0} busy={busy} />
            ))}

            {total < MAX_PHOTOS && (
              <li>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileInput.current?.click()}
                  className="flex size-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-pz border-2 border-dashed border-accent/45 text-link transition-colors hover:border-accent hover:bg-accent-tint disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowUpTrayIcon className="size-6" />
                  <span className="text-xs font-medium">Select</span>
                </button>
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>

      <input
        ref={fileInput}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={pick}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  )
}

/* ── What the folded headers say ──────────────────────────────────────────────
   Each of these is its own component on purpose. `useWatch` re-renders only the
   component that calls it, so typing a title repaints eleven characters of
   header text instead of the whole form and its four sections. Reading the same
   values with `watch()` in the parent is what makes a long form feel heavy.
   ────────────────────────────────────────────────────────────────────────── */

const labelOf = (list, value) => list.find(o => o.value === value)?.label

const ItemSummary = ({ control, categories, conditions }) => {
  const [title, categoryId, condition] = useWatch({
    control, name: ['title', 'categoryId', 'condition'],
  })

  return [
    title || 'Not named yet',
    labelOf(categories, categoryId),
    labelOf(conditions, condition),
  ].filter(Boolean).join(' · ')
}

const PriceSummary = ({ control, published }) => {
  const [price, stock, availability] = useWatch({
    control, name: ['price', 'stock', 'availability'],
  })

  return [
    price ? formatMoney(price) : 'No price',
    `${stock || 0} in stock`,
    published && (Number(stock) === 0
      ? 'Unavailable'
      : availability === 'paused' ? 'Paused' : 'Available'),
  ].filter(Boolean).join(' · ')
}

const DeliverySummary = ({ control, cities }) => {
  const [cityId, delivery] = useWatch({ control, name: ['cityId', 'delivery'] })
  const count = delivery?.length ?? 0

  return [
    labelOf(cities, cityId) ?? 'No location',
    count ? `${count} ${count === 1 ? 'way' : 'ways'} to hand it over` : 'No delivery chosen',
  ].join(' · ')
}

/** The delivery checkboxes. Several at once, at least one. */
const Delivery = ({ options, value, onChange, error }) => (
  <fieldset className="flex flex-col gap-1.5">
    <legend className={labelClass}>How you can hand it over</legend>

    <div className="mt-1.5 flex flex-col gap-3">
      {options.map(option => (
        <Checkbox
          key={option.value}
          label={option.label}
          hint={option.subtitle}
          checked={value.includes(option.value)}
          onChange={checked =>
            onChange(
              checked
                ? [...value, option.value]
                : value.filter(v => v !== option.value),
            )
          }
        />
      ))}
    </div>

    {error && <p className={errorClass}>{error}</p>}
  </fieldset>
)

const Editor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { categories, cities, conditions, delivery: deliveryOptions, ready } = useMeta()

  const [product, setProduct] = useState(null)
  // null, not []: "this person has no shops" and "we have not asked yet" are
  // different answers, and the form needs to tell them apart before it decides
  // whether to draw the shop picker at all.
  const [mine, setMine] = useState(null)
  const [productLoaded, setProductLoaded] = useState(!id)
  const [queued, setQueued] = useState([])
  // Only what the seller dragged. The list actually rendered is derived from
  // this and from what exists, rather than kept in step by an effect: syncing
  // state to state through setState is how a drag gets undone the moment an
  // upload finishes and re-renders the component.
  const [arrangement, setArrangement] = useState([])
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // The form waits for both. Drawing it before the shops are known would let
  // the picker appear a moment later and shove everything below it down.
  const loading = mine === null || !productLoaded

  const {
    register, handleSubmit, control, reset, setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: '', description: '', price: '', stock: 1,
      categoryId: null, cityId: null, shopId: '',
      condition: null, delivery: [], availability: 'active',
    },
  })

  // The one value the form body itself needs: it decides whether availability
  // can be chosen at all. Everything else the headers report is read by the
  // summary components, which repaint on their own.
  const stock = useWatch({ control, name: 'stock' })

  useEffect(() => {
    let ignore = false
    shops
      .mine()
      .then(data => { if (!ignore) setMine(data) })
      // An empty list is the right fallback: someone whose shops could not be
      // fetched still sells under their own name, which is the default anyway.
      .catch(() => { if (!ignore) setMine([]) })
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
          condition: data.condition ?? null,
          delivery: data.delivery ?? [],
          availability: data.status === 'paused' ? 'paused' : 'active',
        })
      })
      .catch(() => { if (!ignore) navigate('/listings', { replace: true }) })
      .finally(() => { if (!ignore) setProductLoaded(true) })

    return () => { ignore = true }
  }, [id, reset, navigate])

  // Local previews hold an object URL each. Released together on the way out,
  // because the browser will not do it and the tab may live for hours.
  useEffect(() => () => queued.forEach(item => URL.revokeObjectURL(item.url)), [queued])

  const savedImages = product?.images ?? []
  const keys = [
    ...savedImages.map(image => `saved-${image.id}`),
    ...queued.map(item => item.key),
  ]
  const keyList = keys.join('|')

  // Whatever was arranged, minus anything since removed, plus anything new on
  // the end. Uploads append, so appending is also what the server will do.
  const order = useMemo(() => {
    const present = arrangement.filter(key => keyList.split('|').includes(key))
    return [...present, ...keyList.split('|').filter(key => key && !present.includes(key))]
  }, [arrangement, keyList])

  // A parent and its children in one list, the children marked with the aisle
  // they belong to. A seller thinks "wool blanket", not "Home, then Bedding".
  const categoryOptions = useMemo(
    () =>
      categories.flatMap(parent => [
        { value: parent.value, label: parent.label },
        ...(parent.children ?? []).map(child => ({
          value: child.value, label: child.label, subtitle: parent.label,
        })),
      ]),
    [categories],
  )

  const shopOptions = useMemo(
    () => [
      { value: '', label: 'Under my own name', subtitle: 'Your username and photo' },
      ...(mine ?? []).map(shop => ({
        value: shop.id,
        label: shop.name,
        subtitle: shop.status === 'active' ? 'Open' : `${shop.status} - cannot publish yet`,
      })),
    ],
    [mine],
  )

  // Picking a shop while creating suggests how that shop usually works. Only
  // when nothing is ticked yet: a seller who already answered is not corrected.
  const suggestDelivery = (nextShopId) => {
    if (id) return
    const shop = (mine ?? []).find(s => s.id === nextShopId)
    if (!shop) return
    setValue('delivery', SHOP_DEFAULT[shop.shipping] ?? [], { shouldValidate: false })
  }

  const empty = Number(stock) === 0
  const published = product && ['active', 'paused', 'out_of_stock'].includes(product.status)

  const photoSummary = (() => {
    const total = (product?.images?.length ?? 0) + queued.length
    if (!total) return 'No photos yet'
    const pending = queued.length ? `, ${queued.length} not saved` : ''
    return `${total} ${total === 1 ? 'photo' : 'photos'}${pending}`
  })()

  // Which section is holding something the form refused. Folding an answer out
  // of sight is only acceptable if the header says where the problem is.
  const problems = {
    item: Boolean(errors.title || errors.categoryId || errors.condition),
    price: Boolean(errors.price || errors.stock),
    delivery: Boolean(errors.cityId || errors.delivery),
  }

  // Stock is the only thing that takes the choice away. A draft can still be
  // set to open or paused; the answer is carried into the moment it publishes.
  const availabilityHint = empty
    ? 'At zero stock nothing is available, whatever is chosen here.'
    : published
      ? undefined
      : 'Applied when you publish it.'

  /**
   * Saving, and optionally publishing what was just saved.
   *
   * Publishing runs through here rather than on its own because it used to call
   * the endpoint directly, which published whatever the server already held and
   * silently threw away whatever was on screen. A button called Publish has to
   * publish what the person is looking at.
   */
  const save = async (values, { publish = false } = {}) => {
    const payload = {
      ...values,
      stock: Number(values.stock),
      shopId: values.shopId === '' ? null : values.shopId,
    }

    // Only meaningful once published, and the API refuses it on a draft.
    if (!published) delete payload.availability

    setBusy(true)
    try {
      const saved = id
        ? await products.update(id, payload)
        : await products.create(payload)

      // The photographs go up now, one at a time, against a row that exists.
      // Each upload answers with the whole listing, and the new photo is the
      // last of them, because the API appends.
      let latest = saved
      const uploaded = {}

      for (const item of queued) {
        latest = await products.addImage(saved.id, item.file)
        const fresh = latest.images?.[latest.images.length - 1]
        if (fresh) uploaded[item.key] = fresh.id
      }

      // And only now the arrangement. It could not be sent earlier: a photo
      // that existed nowhere but this tab had no id to put in the list.
      const wanted = order
        .map(key => (key.startsWith('saved-') ? Number(key.slice(6)) : uploaded[key]))
        .filter(Boolean)

      const asStored = (latest.images ?? []).map(image => image.id)

      if (wanted.length === asStored.length && wanted.join() !== asStored.join()) {
        latest = await products.reorderImages(saved.id, wanted)
      }

      queued.forEach(item => URL.revokeObjectURL(item.url))
      setQueued([])
      setProduct(latest)

      // Its own try: a refused publish must not undo a successful save. The
      // work is on the server either way, and the interceptor has already
      // listed what is still missing.
      let live = false

      if (publish) {
        try {
          let result = await products.publish(saved.id)

          // The API publishes to active, because publishing is what it does.
          // A seller who chose Paused before publishing meant it, so the choice
          // is applied on the other side of the endpoint that could not take it.
          if (values.availability === 'paused') {
            result = await products.update(saved.id, { availability: 'paused' })
          }

          setProduct(result)
          live = true
        } catch {
          // Said by the interceptor, in more detail than a second toast could.
        }
      }

      if (live) {
        notify(
          values.availability === 'paused'
            ? 'Published, and paused as you asked.'
            : 'Your listing is live.',
          'success',
        )
      }
      else if (!publish) {
        notify(
          id ? 'Listing saved.' : 'Saved as a draft. Publish it when you are ready.',
          'success',
        )
      }

      // Done means gone from here. The listing screen is where the thing they
      // just worked on now lives, and staying put after a save that worked
      // reads as a save that did not.
      //
      // Replacing rather than pushing on the way out of the create route: that
      // entry is a finished one-shot, and going back to an empty form is not
      // what anyone means by back.
      if (live || !publish) return navigate('/listings', { replace: !id })

      // Publishing was refused. The save itself went through, so the listing
      // exists and the person is left with it open to fix whatever the message
      // named — but never on the create route, which invites a duplicate.
      if (!id) navigate(`/listings/${saved.id}`, { replace: true })
    } catch {
      // Reported by the interceptor. Anything already uploaded stays uploaded,
      // which is why the queue is only cleared once the whole run succeeded.
    } finally {
      setBusy(false)
    }
  }

  const act = async (action, message) => {
    setBusy(true)
    try {
      setProduct(await products[action](id))
      notify(message, 'success')
    } catch {
      // The interceptor shows the list of what is still missing.
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await products.remove(id)
      notify('Listing deleted.', 'success')
      navigate('/listings', { replace: true })
    } catch {
      // Reported by the interceptor, and the page stays where it is.
      setBusy(false)
      setConfirming(false)
    }
  }

  const removeSaved = async (imageId) => {
    setBusy(true)
    try {
      setProduct(await products.removeImage(id, imageId))
    } catch {
      // Reported by the interceptor.
    } finally {
      setBusy(false)
    }
  }

  const unqueue = (key) =>
    setQueued(current => {
      const going = current.find(item => item.key === key)
      if (going) URL.revokeObjectURL(going.url)
      return current.filter(item => item.key !== key)
    })

  const tiles = order
    .map(key => {
      if (key.startsWith('saved-')) {
        const image = savedImages.find(i => `saved-${i.id}` === key)
        return image && { key, url: image.url, pending: false, remove: () => removeSaved(image.id) }
      }

      const item = queued.find(q => q.key === key)
      return item && { key, url: item.url, pending: true, remove: () => unqueue(key) }
    })
    .filter(Boolean)

  if (loading) {
    return (
      <div className="shell py-8 sm:py-12" aria-hidden>
        <div className="mx-auto max-w-2xl">
          <div className="h-8 w-56 animate-pulse rounded-full bg-sunk" />
          <div className="panel mt-7 h-[32rem] animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="shell py-8 sm:py-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
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

        {/* Folded sections rather than one long scroll. Each key carries its
            own problem flag so a section holding a refused field remounts open
            instead of hiding the reason the submit did nothing. */}
        <form onSubmit={handleSubmit(save)} className="flex flex-col gap-4">
          <Accordion
            key={`item-${problems.item}`}
            title="The item"
            summary={<ItemSummary control={control} categories={categoryOptions} conditions={conditions} />}
            problem={problems.item}
            defaultOpen
          >
            <div className="flex flex-col gap-6">
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

            <Controller
              name="categoryId" control={control}
              rules={{ required: 'Pick the aisle it belongs in.' }}
              render={({ field }) => (
                <Combobox
                  label="Category" options={categoryOptions}
                  value={field.value} onChange={field.onChange}
                  placeholder={ready ? 'Start typing a category' : 'Loading…'}
                  disabled={!ready}
                  emptyMessage="No category by that name."
                  error={errors.categoryId?.message}
                />
              )}
            />

            <Controller
              name="condition" control={control}
              rules={{ required: 'Say what condition it is in.' }}
              render={({ field }) => (
                <Select
                  label="Condition" options={conditions}
                  value={field.value} onChange={field.onChange}
                  // Never preselected. A default here publishes everything
                  // second-hand as new by whoever did not scroll this far.
                  placeholder={ready ? 'Choose one' : 'Loading…'}
                  disabled={!ready}
                  error={errors.condition?.message}
                />
              )}
            />

            {/* Above delivery on purpose: choosing a shop suggests how that
                shop usually hands things over. */}
            {mine?.length > 0 && (
              <Controller
                name="shopId" control={control}
                render={({ field }) => (
                  <Select
                    label="Sold as" options={shopOptions} value={field.value}
                    onChange={next => { field.onChange(next); suggestDelivery(next) }}
                  />
                )}
              />
            )}

            <Textarea
              label="Description" optional rows={4}
              placeholder="Wool from Nariño, woven on a pedal loom. 180 by 130 cm."
              error={errors.description?.message}
              {...register('description')}
            />
            </div>
          </Accordion>

          <Accordion
            key={`price-${problems.price}`}
            title="Price and availability"
            summary={<PriceSummary control={control} published={published} />}
            problem={problems.price}
          >
            <div className="flex flex-col gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="Price" prefix="$" inputMode="decimal" placeholder="180000"
                error={errors.price?.message}
                {...register('price', {
                  required: 'Set a price.',
                  pattern: { value: /^\d{1,10}(\.\d{1,2})?$/, message: 'Numbers only, like 180000.' },
                })}
              />

              <Input
                label="Stock" inputMode="numeric"
                hint="At zero it stays listed but nobody can buy."
                error={errors.stock?.message}
                {...register('stock', {
                  required: 'Say how many you have.',
                  min: { value: 0, message: 'Zero or more.' },
                })}
              />
            </div>

            <Controller
              name="availability" control={control}
              render={({ field }) => (
                <Select
                  label="Availability"
                  options={[
                    { value: 'active', label: 'Available', subtitle: 'Buyers can see and buy it' },
                    { value: 'paused', label: 'Paused', subtitle: 'Hidden for now, nothing lost' },
                  ]}
                  value={empty ? null : field.value}
                  onChange={field.onChange}
                  // Out of stock is not on the list because it is not a choice.
                  // The control says so instead of offering a word the seller
                  // cannot pick and the shelf will overrule anyway.
                  placeholder={empty ? 'Unavailable, no stock' : 'Choose one'}
                  disabled={empty}
                  hint={availabilityHint}
                />
              )}
            />

            </div>
          </Accordion>

          <Accordion
            key={`delivery-${problems.delivery}`}
            title="Location and delivery"
            summary={<DeliverySummary control={control} cities={cities} />}
            problem={problems.delivery}
          >
            <div className="flex flex-col gap-6">
            <Controller
              name="cityId" control={control}
              rules={{ required: 'We need to know where it is.' }}
              render={({ field }) => (
                <Combobox
                  label="Location" options={cities}
                  value={field.value} onChange={field.onChange}
                  placeholder={ready ? 'Start typing a city' : 'Loading…'}
                  disabled={!ready}
                  emptyMessage="No city by that name. Try the department instead."
                  error={errors.cityId?.message}
                />
              )}
            />

            <Controller
              name="delivery" control={control}
              rules={{ validate: v => v.length > 0 || 'Pick at least one.' }}
              render={({ field }) => (
                <Delivery
                  options={deliveryOptions} value={field.value}
                  onChange={field.onChange} error={errors.delivery?.message}
                />
              )}
            />
            </div>
          </Accordion>

          <Accordion title="Photos" summary={photoSummary}>
            <Photos
              tiles={tiles}
              busy={busy}
              onQueue={items => setQueued(current => [...current, ...items])}
              onReorder={setArrangement}
            />
          </Accordion>

          <div className="flex flex-wrap gap-3">
            {/* The submit, and so what Enter does, is the safe one. Nothing
                reaches the square by pressing return in a text field. */}
            <Button.Action
              type="submit"
              variant={published ? 'solid' : 'outline'}
              color={published ? 'primary' : 'neutral'}
              loading={isSubmitting || busy}
            >
              {id ? 'Save changes' : 'Save as draft'}
            </Button.Action>

            {(!product || !['active', 'paused'].includes(product.status)) && (
              <Button.Action
                type="button" disabled={busy}
                onClick={handleSubmit(values => save(values, { publish: true }))}
              >
                {id ? 'Save and publish' : 'Publish'}
              </Button.Action>
            )}

            {product && product.status !== 'archived' && (
              <Button.Action
                type="button" variant="ghost" disabled={busy}
                onClick={() => act('archive', 'Listing archived.')}
              >
                Archive
              </Button.Action>
            )}

            {product && (
              <Button.Action
                type="button" variant="ghost" color="danger" disabled={busy}
                className="ml-auto"
                onClick={() => setConfirming(true)}
              >
                Delete
              </Button.Action>
            )}
          </div>
        </form>

        <Confirm
          open={confirming}
          title={`Delete ${product?.title ?? 'this listing'}?`}
          body="The listing and its photos go for good. Anything already sold keeps its record. To take it off the square without losing it, archive it instead."
          confirmLabel="Delete listing"
          loading={busy}
          onConfirm={remove}
          onCancel={() => setConfirming(false)}
        />
      </div>
    </div>
  )
}

export default Editor
