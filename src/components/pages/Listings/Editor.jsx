import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
import { useAuth } from '../../../context/auth'
import { useLanguage } from '../../../context/language'
import { useMeta } from '../../../context/meta'
import { formatMoney } from '../../../utils/money'
import { notify } from '../../../utils/notify'
import {
  rateUnitShort,
  withAddressVisibilityLabels,
  withCategoryLabels,
  withConditionLabels,
  withFeatureLabels,
  withHandoverLabels,
  withOperationLabels,
  withPropertyConditionLabels,
  withRateUnitLabels,
  propertySummary,
} from '../../../utils/vocabulary'
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

// Every field that belongs to a property and to nothing else. Named once
// because three things read the list — the defaults, what is loaded back when
// editing, and what is stripped from the payload of a listing that is not one
// — and three copies of it drift apart the first time a field is added.
const PROPERTY_FIELDS = [
  'operation', 'builtArea', 'privateArea', 'lotArea',
  'bedrooms', 'bathrooms', 'halfBaths', 'parking',
  'stratum', 'floor', 'builtYear', 'adminFee', 'adminIncluded',
  'features', 'neighborhood', 'address', 'addressVisibility', 'phonePublic',
]

// What each of them is when there is nothing stored. Empty strings rather than
// nulls for everything that renders as a text input: a controlled input handed
// null becomes an uncontrolled one, and React complains about the switch for
// the rest of the session.
const DEFAULT_PROPERTY = {
  operation: null,
  builtArea: '', privateArea: '', lotArea: '',
  bedrooms: 0, bathrooms: 0, halfBaths: 0, parking: 0,
  stratum: null, floor: '', builtYear: '',
  adminFee: '', adminIncluded: false,
  features: [], neighborhood: '', address: '',
  addressVisibility: 'exact', phonePublic: false,
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
  const { t } = useTranslation()
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
          aria-label={t('Editor.Photos.Remove')}
        >
          <TrashIcon className="size-4" />
        </Button.Icon>
      </span>

      {/* One bar, and "not saved" wins the slot. A photo the seller believes is
          stored and is not is the more urgent fact. */}
      {tile.pending ? (
        <span className="absolute inset-x-0 bottom-0 bg-info py-1 text-center text-[10px] font-bold tracking-wide text-on-info uppercase">
          {t('Editor.Photos.NotSaved')}
        </span>
      ) : cover ? (
        <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-1 text-center text-[10px] font-bold tracking-wide text-ground uppercase">
          {t('Editor.Photos.Cover')}
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
const Photos = ({ tiles, onQueue, onReorder, busy, kind }) => {
  const { t } = useTranslation()
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
    if (room <= 0) return notify(t('Editor.Photos.MaxReached', { max: MAX_PHOTOS }), 'error')

    const tooBig = files.filter(file => file.size > MAX_MB * 1024 * 1024)
    if (tooBig.length) notify(t('Editor.Photos.SkippedTooBig', { count: tooBig.length, max: MAX_MB }), 'error')

    const accepted = files.filter(file => file.size <= MAX_MB * 1024 * 1024).slice(0, room)
    if (files.length > room) notify(t('Editor.Photos.OnlyWillFit', { count: room }), 'error')

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
      {/* A photograph proves an object is real and is what it says. Work has
          nothing to photograph before it is done, so the service version stops
          promising that one is required — which it no longer is. */}
      <p className="text-sm leading-relaxed text-muted">
        {kind === 'service'
          ? t('Editor.Photos.DragHintService', { max: MAX_PHOTOS })
          : kind === 'property'
            ? t('Editor.Photos.DragHintProperty', { max: MAX_PHOTOS })
            : t('Editor.Photos.DragHint', { max: MAX_PHOTOS })}
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
                  <span className="text-xs font-medium">{t('Editor.Photos.Select')}</span>
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

const ItemSummary = ({ control, categories, conditions, kind }) => {
  const { t } = useTranslation()
  const [title, categoryId, condition] = useWatch({
    control, name: ['title', 'categoryId', 'condition'],
  })

  return [
    title || t('Editor.Summary.NotNamed'),
    labelOf(categories, categoryId),
    // A service has no condition, so nothing goes in its place: an empty slot
    // reads as a field somebody forgot rather than one that does not exist.
    kind === 'service' ? null : labelOf(conditions, condition),
  ].filter(Boolean).join(' · ')
}

const PriceSummary = ({ control, published, kind }) => {
  const { t } = useTranslation()
  const [price, stock, availability, rateUnit, onRequest] = useWatch({
    control, name: ['price', 'stock', 'availability', 'rateUnit', 'onRequest'],
  })

  const isService = kind === 'service'

  // Read off the form rather than off a saved listing, so the header keeps up
  // while the seller is still typing.
  const money = onRequest
    ? t('Common.OnRequest')
    : price
      ? formatMoney(price)
      : isService ? t('Editor.Summary.NoRate') : t('Editor.Summary.NoPrice')

  const unit = isService && !onRequest && rateUnit ? rateUnitShort(t, rateUnit) : null

  return [
    unit ? `${money} / ${unit}` : money,
    // Nobody keeps four caregivers in reserve, so a service says nothing about
    // a shelf it does not have.
    isService ? null : t('Listings.InStock', { count: Number(stock) || 0 }),
    published && (!isService && Number(stock) === 0
      ? t('Editor.Summary.Unavailable')
      : availability === 'paused' ? t('Listings.Status.Paused.Label') : t('Editor.Summary.Available')),
  ].filter(Boolean).join(' · ')
}

const DeliverySummary = ({ control, cities, kind }) => {
  const { t } = useTranslation()
  const [cityId, delivery] = useWatch({ control, name: ['cityId', 'delivery'] })
  const count = delivery?.length ?? 0
  const isService = kind === 'service'

  const chosen = isService
    ? (count ? t('Editor.Summary.WaysToWork', { count }) : t('Editor.Summary.NoWhereChosen'))
    : (count ? t('Editor.Summary.WaysToHandOver', { count }) : t('Editor.Summary.NoDeliveryChosen'))

  return [labelOf(cities, cityId) ?? t('Editor.Summary.NoLocation'), chosen].join(' · ')
}

/**
 * How the two of you meet. Several at once, at least one.
 *
 * One control for both kinds, because it is one question — where a parcel goes,
 * or where the work happens — and only the words in front of it change.
 */
const Delivery = ({ options, value, onChange, error, kind }) => {
  const { t } = useTranslation()

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={labelClass}>
        {kind === 'service' ? t('Editor.Where.Legend') : t('Editor.Delivery.Legend')}
      </legend>

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
}

/**
 * What is being published, asked once and never again.
 *
 * Only on the way in. A product does not become a service — the two are priced
 * differently, filed in different trees and ordered differently — so once a row
 * exists this reads back as a fact rather than a control. Offering it as an
 * editable field would be offering a change that rewrites half the row.
 */
const Kind = ({ value, onChange }) => {
  const { t } = useTranslation()

  const options = [
    { value: 'good', label: t('Editor.Kind.Good.Label'), subtitle: t('Editor.Kind.Good.Subtitle') },
    { value: 'service', label: t('Editor.Kind.Service.Label'), subtitle: t('Editor.Kind.Service.Subtitle') },
    { value: 'property', label: t('Editor.Kind.Property.Label'), subtitle: t('Editor.Kind.Property.Hint') },
  ]

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={labelClass}>{t('Editor.Kind.Legend')}</legend>

      <div className="mt-1.5 grid gap-3 sm:grid-cols-3">
        {options.map(option => {
          const picked = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={picked}
              className={clsx(
                'cursor-pointer rounded-pz border p-4 text-left transition-colors',
                picked
                  ? 'border-accent bg-accent-tint'
                  : 'border-line-strong hover:border-ink hover:bg-sunk',
              )}
            >
              <span className={clsx('block text-sm font-semibold', picked ? 'text-link' : 'text-ink')}>
                {option.label}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                {option.subtitle}
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/**
 * What the rooms-and-areas section says while it is folded shut.
 *
 * The four numbers somebody scanning their own listing checks: the same ones
 * the card shows a shopper. Watched here rather than passed down, so the header
 * repaints on its own without re-rendering the whole form on every keystroke.
 */
const PropertySummaryLine = ({ control }) => {
  const { t } = useTranslation()
  const [bedrooms, bathrooms, parking, builtArea] = useWatch({
    control, name: ['bedrooms', 'bathrooms', 'parking', 'builtArea'],
  })

  return propertySummary(t, {
    bedrooms: Number(bedrooms), bathrooms: Number(bathrooms),
    parking: Number(parking), builtArea,
  }) || null
}

const Editor = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { account } = useAuth()
  const {
    categories: rawCategories, cities, conditions: rawConditions,
    delivery: rawDelivery, serviceDelivery: rawServiceDelivery,
    rateUnits: rawRateUnits, ready,
    operations: rawOperations, propertyConditions: rawPropertyConditions,
    features: rawFeatures, addressVisibility: rawAddressVisibility,
    strata: rawStrata,
  } = useMeta()

  // Whether there is a number to publish at all. `phone` is nullable on an
  // account and plenty of people never filled it in, so the tick that offers
  // to show it has to know before it offers.
  const hasPhone = Boolean(account?.phone)

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
  const [archiving, setArchiving] = useState(false)

  // The form waits for both. Drawing it before the shops are known would let
  // the picker appear a moment later and shove everything below it down.
  const loading = mine === null || !productLoaded

  const {
    register, handleSubmit, control, reset, setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      kind: 'good',
      title: '', description: '', price: '', stock: 1,
      categoryId: null, cityId: null, shopId: '',
      condition: null, delivery: [], availability: 'active',
      // Only a service uses these. `onRequest` never reaches the API — it is
      // the tick that means "send no price at all".
      rateUnit: null, onRequest: false,
      // And only a property uses these. Flat rather than nested under a
      // `property` key, because react-hook-form registers by path and a
      // nested one would make every field name in this form twice as long to
      // spare one line of assembly in `save`.
      operation: null, propertyCondition: null,
      builtArea: '', privateArea: '', lotArea: '',
      bedrooms: 0, bathrooms: 0, halfBaths: 0, parking: 0,
      stratum: null, floor: '', builtYear: '',
      adminFee: '', adminIncluded: false,
      features: [], neighborhood: '', address: '',
      addressVisibility: 'exact', phonePublic: false,
    },
  })

  // Watched rather than read once: picking the kind on the way in changes which
  // half of this form exists, and the category tree under it.
  const kind = useWatch({ control, name: 'kind' })
  const onRequest = useWatch({ control, name: 'onRequest' })
  const isService = kind === 'service'
  const isProperty = kind === 'property'

  const categories = useMemo(
    () => withCategoryLabels(language, rawCategories, kind),
    [language, rawCategories, kind],
  )
  const conditions = useMemo(() => withConditionLabels(t, rawConditions), [t, rawConditions])
  const deliveryOptions = useMemo(
    () => withHandoverLabels(t, kind, isService ? rawServiceDelivery : rawDelivery),
    [t, kind, isService, rawServiceDelivery, rawDelivery],
  )
  const rateUnits = useMemo(() => withRateUnitLabels(t, rawRateUnits), [t, rawRateUnits])
  const operations = useMemo(() => withOperationLabels(t, rawOperations), [t, rawOperations])
  const propertyConditions = useMemo(
    () => withPropertyConditionLabels(t, rawPropertyConditions),
    [t, rawPropertyConditions],
  )
  const featureOptions = useMemo(() => withFeatureLabels(t, rawFeatures), [t, rawFeatures])
  const addressVisibility = useMemo(
    () => withAddressVisibilityLabels(t, rawAddressVisibility),
    [t, rawAddressVisibility],
  )
  // Plain numbers with a word in front, so a column of digits in a picker says
  // what it is counting.
  const strata = useMemo(
    () => rawStrata.map(({ value }) => ({
      value, label: t('Vocabulary.Stratum.Value', { stratum: value }),
    })),
    [t, rawStrata],
  )

  // The one value the form body itself needs: it decides whether availability
  // can be chosen at all. Everything else the headers report is read by the
  // summary components, which repaint on their own.
  const stock = useWatch({ control, name: 'stock' })
  // Which of the two prices is being asked for, and whether "included in the
  // rent" is a question that means anything.
  const operation = useWatch({ control, name: 'operation' })
  const renting = operation === 'rent'

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
          kind: data.kind ?? 'good',
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
          rateUnit: data.rateUnit ?? null,
          // A stored null price is the seller having said "on request", which
          // is a different thing from an empty field they have not filled in.
          onRequest: data.kind === 'service' && data.price === null,
          // The other half of the row, flattened back out. Nulls become empty
          // strings for the number inputs: a controlled input handed null
          // switches to uncontrolled and React complains about it forever
          // after.
          ...Object.fromEntries(
            PROPERTY_FIELDS.map(field => [field, data.property?.[field] ?? DEFAULT_PROPERTY[field]]),
          ),
          propertyCondition: data.property?.condition ?? null,
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
      { value: '', label: t('Editor.SoldAs.UnderOwnName'), subtitle: t('Editor.SoldAs.YourUsername') },
      ...(mine ?? []).map(shop => ({
        value: shop.id,
        label: shop.name,
        // Owned and joined shops come back in one list — `mine` says which —
        // and a collaborator publishing under somebody else's brand should see
        // that at a glance, in the same picker rather than a second one.
        subtitle: shop.status !== 'active'
          ? t('Editor.SoldAs.CannotPublishYet', { status: shop.status })
          : shop.mine === false
            ? t('Shops.Mine.Collaborator')
            : t('Dashboard.Status.Active.Label'),
      })),
    ],
    [mine, t],
  )

  // Picking a shop while creating suggests how that shop usually works. Only
  // when nothing is ticked yet: a seller who already answered is not corrected.
  const suggestDelivery = (nextShopId) => {
    if (id) return
    const shop = (mine ?? []).find(s => s.id === nextShopId)
    if (!shop) return
    setValue('delivery', SHOP_DEFAULT[shop.shipping] ?? [], { shouldValidate: false })
  }

  // Only a thing runs out. A stored service carries a stock of zero because
  // the column has to hold something, and reading it here would grey out the
  // availability of every service the moment it was opened for editing.
  const empty = !isService && Number(stock) === 0
  const published = product && ['active', 'paused', 'out_of_stock'].includes(product.status)

  const photoSummary = (() => {
    const total = (product?.images?.length ?? 0) + queued.length
    if (!total) return t('Editor.Summary.NoPhotosYet')
    const pending = queued.length ? t('Editor.Summary.NotSavedSuffix', { count: queued.length }) : ''
    return `${t('Editor.Summary.PhotosCount', { count: total })}${pending}`
  })()

  // Which section is holding something the form refused. Folding an answer out
  // of sight is only acceptable if the header says where the problem is.
  const problems = {
    item: Boolean(
      errors.title || errors.categoryId || errors.condition ||
      errors.operation || errors.propertyCondition,
    ),
    price: Boolean(errors.price || errors.stock || errors.rateUnit),
    delivery: Boolean(errors.cityId || errors.delivery || errors.address),
    property: Boolean(errors.builtArea || errors.privateArea),
  }

  // Stock is the only thing that takes the choice away. A draft can still be
  // set to open or paused; the answer is carried into the moment it publishes.
  const availabilityHint = empty
    ? t('Editor.Availability.HintZero')
    : published
      ? undefined
      : t('Editor.Availability.HintDraft')

  /**
   * Saving, and optionally publishing what was just saved.
   *
   * Publishing runs through here rather than on its own because it used to call
   * the endpoint directly, which published whatever the server already held and
   * silently threw away whatever was on screen. A button called Publish has to
   * publish what the person is looking at.
   */
  const save = async (values, { publish = false } = {}) => {
    // `onRequest` is the form's own word for it and means nothing to the API,
    // which reads a null price as the same statement.
    const { onRequest: quoted, ...rest } = values

    const payload = {
      ...rest,
      stock: Number(values.stock),
      shopId: values.shopId === '' ? null : values.shopId,
    }

    if (values.kind === 'property') {
      // A property has no shelf and no second-hand hour. The API refuses both
      // rather than ignoring them, which is what keeps the two sides honest
      // about what a property is.
      delete payload.stock
      delete payload.condition
      delete payload.rateUnit
      delete payload.delivery

      // The form calls it `propertyCondition` so it cannot collide with the
      // goods field of the same name in the same `values` object; the API
      // calls it `condition`, because on its own table there is nothing to
      // collide with.
      payload.condition = values.propertyCondition
      delete payload.propertyCondition
    } else if (values.kind === 'service') {
      // Neither belongs to somebody's time, and sending them is what the API
      // refuses rather than quietly ignores.
      delete payload.stock
      delete payload.condition

      if (quoted) {
        payload.price = null
        payload.rateUnit = null
      }
    } else {
      delete payload.rateUnit
    }

    // The property fields go nowhere else, so anything else carrying them is
    // sending noise the API would have to know to ignore.
    if (values.kind !== 'property') {
      for (const field of PROPERTY_FIELDS) delete payload[field]
      delete payload.propertyCondition
    }

    // The kind is set once, when the row is made. An edit that carried one
    // would be asking to rewrite what the listing is.
    if (id) delete payload.kind

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
            ? t('Editor.PublishedPausedNotify')
            : t('Editor.LiveNotify'),
          'success',
        )
      }
      else if (!publish) {
        notify(
          id ? t('Editor.SavedNotify') : t('Editor.SavedAsDraftNotify'),
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

  // Answers whether it worked, so a dialog waiting on it knows whether to
  // close.
  const act = async (action, message) => {
    setBusy(true)
    try {
      setProduct(await products[action](id))
      notify(message, 'success')
      return true
    } catch {
      // The interceptor shows the list of what is still missing.
      return false
    } finally {
      setBusy(false)
    }
  }

  const archive = async () => {
    if (await act('archive', t('Editor.ArchivedNotify'))) setArchiving(false)
  }

  const remove = async () => {
    setBusy(true)
    try {
      await products.remove(id)
      notify(t('Editor.DeletedNotify'), 'success')
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
          <div className="panel mt-7 h-128 animate-pulse" />
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
            {t('Header.Account.YourListings')}
          </Link>

          <h1 className="rule-accent mt-5 font-display text-3xl font-bold tracking-tight text-ink">
            {id
              ? t('Editor.EditTitle')
              : isService ? t('Editor.PublishService') : t('Sell.Get.ListItem')}
          </h1>
        </div>

        {/* Folded sections rather than one long scroll. Each key carries its
            own problem flag so a section holding a refused field remounts open
            instead of hiding the reason the submit did nothing. */}
        <form onSubmit={handleSubmit(save)} className="flex flex-col gap-4">
          <Accordion
            key={`item-${problems.item}`}
            title={
              isProperty
                ? t('Editor.Section.Property')
                : isService ? t('Editor.Section.Service') : t('Editor.Section.Item')
            }
            summary={<ItemSummary control={control} categories={categoryOptions} conditions={conditions} kind={kind} />}
            problem={problems.item}
            defaultOpen
          >
            <div className="flex flex-col gap-6">
            {/* First, because everything under it depends on the answer: which
                category tree, which price shape, which questions at all. */}
            {id ? (
              <p className="rounded-pz border border-line bg-sunk px-4 py-3 text-sm text-muted">
                <span className="font-medium text-ink">
                  {isService ? t('Editor.Kind.Service.Label') : t('Editor.Kind.Good.Label')}
                </span>
                {' — '}
                {t('Editor.Kind.Locked')}
              </p>
            ) : (
              <Controller
                name="kind" control={control}
                render={({ field }) => (
                  <Kind
                    value={field.value}
                    onChange={next => {
                      field.onChange(next)
                      // The trees do not overlap, so whatever was picked in the
                      // other one is not a category in this one. Cleared rather
                      // than left to fail validation with a value the seller
                      // can no longer see in the list.
                      setValue('categoryId', null)
                      setValue('delivery', [])
                    }}
                  />
                )}
              />
            )}

            <Input
              label={t('Editor.Title.Label')}
              placeholder={
                isProperty
                  ? t('Editor.Title.PlaceholderProperty')
                  : isService ? t('Editor.Title.PlaceholderService') : t('Editor.Title.Placeholder')
              }
              hint={
                isProperty
                  ? t('Editor.Title.HintProperty')
                  : isService ? t('Editor.Title.HintService') : t('Editor.Title.Hint')
              }
              error={errors.title?.message}
              {...register('title', {
                required: t('Editor.Title.Required'),
                minLength: { value: 3, message: t('ShopRequest.Name.MinLength') },
              })}
            />

            <Controller
              name="categoryId" control={control}
              rules={{ required: t('Editor.Category.Required') }}
              render={({ field }) => (
                <Combobox
                  label={t('Editor.Category.Label')} options={categoryOptions}
                  value={field.value} onChange={field.onChange}
                  placeholder={ready ? t('Editor.Category.StartTyping') : t('Common.Loading')}
                  disabled={!ready}
                  emptyMessage={t('Editor.Category.Empty')}
                  error={errors.categoryId?.message}
                />
              )}
            />

            {/* Sale or rent, and it comes before the price because it is
                what decides what the price means. */}
            {isProperty && (
              <>
                <Controller
                  name="operation" control={control}
                  rules={{ required: t('Editor.Operation.Required') }}
                  render={({ field }) => (
                    <Select
                      label={t('Editor.Operation.Label')} options={operations}
                      hint={t('Editor.Operation.Hint')}
                      value={field.value} onChange={field.onChange}
                      placeholder={ready ? t('Common.ChooseOne') : t('Common.Loading')}
                      disabled={!ready}
                      error={errors.operation?.message}
                    />
                  )}
                />

                <Controller
                  name="propertyCondition" control={control}
                  rules={{ required: t('Editor.PropertyCondition.Required') }}
                  render={({ field }) => (
                    <Select
                      label={t('Editor.PropertyCondition.Label')} options={propertyConditions}
                      value={field.value} onChange={field.onChange}
                      placeholder={ready ? t('Common.ChooseOne') : t('Common.Loading')}
                      disabled={!ready}
                      error={errors.propertyCondition?.message}
                    />
                  )}
                />
              </>
            )}

            {/* There is no second-hand hour, and a building answers this on
                its own row with its own words. */}
            {!isService && !isProperty && (
              <Controller
                name="condition" control={control}
                rules={{ required: isService ? false : t('Editor.Condition.Required') }}
                render={({ field }) => (
                  <Select
                    label={t('Editor.Condition.Label')} options={conditions}
                    value={field.value} onChange={field.onChange}
                    // Never preselected. A default here publishes everything
                    // second-hand as new by whoever did not scroll this far.
                    placeholder={ready ? t('Common.ChooseOne') : t('Common.Loading')}
                    disabled={!ready}
                    error={errors.condition?.message}
                  />
                )}
              />
            )}

            {/* Above delivery on purpose: choosing a shop suggests how that
                shop usually hands things over. */}
            {mine?.length > 0 && (
              <Controller
                name="shopId" control={control}
                render={({ field }) => (
                  <Select
                    label={isService ? t('Editor.SoldAs.LabelService') : t('Editor.SoldAs.Label')}
                    options={shopOptions} value={field.value}
                    onChange={next => { field.onChange(next); suggestDelivery(next) }}
                  />
                )}
              />
            )}

            <Textarea
              label={t('Product.DescriptionTitle')} optional rows={4}
              placeholder={
                isProperty
                  ? t('Editor.Description.PlaceholderProperty')
                  : isService ? t('Editor.Description.PlaceholderService') : t('Editor.Description.Placeholder')
              }
              error={errors.description?.message}
              {...register('description')}
            />
            </div>
          </Accordion>

          <Accordion
            key={`price-${problems.price}`}
            title={
              isProperty
                ? (renting ? t('Editor.Price.Rent') : t('Editor.Price.Sale'))
                : isService ? t('Editor.Section.RateAvailability') : t('Editor.Section.Price')
            }
            summary={<PriceSummary control={control} published={published} kind={kind} />}
            problem={problems.price}
          >
            <div className="flex flex-col gap-6">
            {/* Some work cannot be costed before it is seen. The tick comes
                first because it decides whether the field below it applies at
                all, and a disabled field under an unticked box is easier to
                read than a field that vanishes. */}
            {isService && (
              <Controller
                name="onRequest" control={control}
                render={({ field }) => (
                  <Checkbox
                    label={t('Editor.Rate.OnRequest.Label')}
                    hint={t('Editor.Rate.OnRequest.Hint')}
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label={
                  isProperty
                    ? (renting ? t('Editor.Price.Rent') : t('Editor.Price.Sale'))
                    : isService ? t('Editor.Rate.Label') : t('Editor.Price.Label')
                }
                hint={isProperty && renting ? t('Editor.Price.RentHint') : undefined}
                prefix="$" inputMode="decimal"
                placeholder={
                  isProperty
                    ? (renting ? '2500000' : '450000000')
                    : isService ? t('Editor.Rate.Placeholder') : '180000'
                }
                disabled={isService && onRequest}
                error={errors.price?.message}
                {...register('price', {
                  required: isService && onRequest ? false : t('Editor.Rate.Required'),
                  pattern: isService && onRequest
                    ? undefined
                    : { value: /^\d{1,10}(\.\d{1,2})?$/, message: t('Editor.Price.Pattern') },
                })}
              />

              {isService ? (
                <Controller
                  name="rateUnit" control={control}
                  rules={{ required: onRequest ? false : t('Editor.Rate.Unit.Required') }}
                  render={({ field }) => (
                    <Select
                      label={t('Editor.Rate.Unit.Label')} options={rateUnits}
                      value={field.value} onChange={field.onChange}
                      placeholder={ready ? t('Common.ChooseOne') : t('Common.Loading')}
                      disabled={!ready || onRequest}
                      error={errors.rateUnit?.message}
                    />
                  )}
                />
              ) : (
                <Input
                  label={t('Editor.Stock.Label')} inputMode="numeric"
                  hint={t('Editor.Stock.Hint')}
                  error={errors.stock?.message}
                  {...register('stock', {
                    required: t('Editor.Stock.Required'),
                    min: { value: 0, message: t('Editor.Stock.Min') },
                  })}
                />
              )}
            </div>

            <Controller
              name="availability" control={control}
              render={({ field }) => (
                <Select
                  label={t('Editor.Availability.Label')}
                  options={[
                    {
                      value: 'active',
                      label: t('Editor.Summary.Available'),
                      // A client requests a service; nobody buys one.
                      subtitle: isService
                        ? t('Editor.Availability.ActiveService.Subtitle')
                        : t('Editor.Availability.Active.Subtitle'),
                    },
                    { value: 'paused', label: t('Listings.Status.Paused.Label'), subtitle: t('Editor.Availability.Paused.Subtitle') },
                  ]}
                  value={empty ? null : field.value}
                  onChange={field.onChange}
                  // Out of stock is not on the list because it is not a choice.
                  // The control says so instead of offering a word the seller
                  // cannot pick and the shelf will overrule anyway.
                  placeholder={empty ? t('Editor.Availability.Unavailable') : t('Common.ChooseOne')}
                  disabled={empty}
                  hint={availabilityHint}
                />
              )}
            />

            </div>
          </Accordion>

          <Accordion
            key={`delivery-${problems.delivery}`}
            title={
              isProperty
                ? t('Editor.Section.Address')
                : isService ? t('Editor.Section.Where') : t('Editor.Section.Delivery')
            }
            summary={<DeliverySummary control={control} cities={cities} kind={kind} />}
            problem={problems.delivery}
          >
            <div className="flex flex-col gap-6">
            <Controller
              name="cityId" control={control}
              rules={{ required: t('Editor.Location.Required') }}
              render={({ field }) => (
                <Combobox
                  label={t('Editor.Location.Label')} options={cities}
                  value={field.value} onChange={field.onChange}
                  placeholder={ready ? t('ShopRequest.City.StartTyping') : t('Common.Loading')}
                  disabled={!ready}
                  emptyMessage={t('ShopRequest.City.Empty')}
                  error={errors.cityId?.message}
                />
              )}
            />

            {/* Nothing is handed over and nobody travels to deliver it, so
                the question is not asked. What replaces it is where it is,
                and how much of that a stranger gets to see. */}
            {isProperty ? (
              <>
                <Input
                  label={t('Editor.Neighborhood.Label')}
                  placeholder={t('Editor.Neighborhood.Placeholder')}
                  hint={t('Editor.Neighborhood.Hint')}
                  optional
                  {...register('neighborhood')}
                />

                <Input
                  label={t('Editor.Address.Label')}
                  placeholder={t('Editor.Address.Placeholder')}
                  hint={t('Editor.Address.Hint')}
                  error={errors.address?.message}
                  {...register('address', { required: t('Editor.Address.Required') })}
                />

                <Controller
                  name="addressVisibility" control={control}
                  render={({ field }) => (
                    <Select
                      label={t('Editor.Address.Visibility')} options={addressVisibility}
                      hint={t('Editor.Address.VisibilityHint')}
                      value={field.value} onChange={field.onChange}
                      disabled={!ready}
                    />
                  )}
                />

                {/* Off unless the owner says otherwise, and disabled outright
                    when there is no number to show — a tick that does nothing
                    is worse than one that is not offered. */}
                <Controller
                  name="phonePublic" control={control}
                  render={({ field }) => (
                    <Checkbox
                      label={t('Editor.Phone.Public')}
                      hint={
                        hasPhone
                          ? `${t('Editor.Phone.PublicHint')} ${t('Editor.Phone.PublicWarning')}`
                          : t('Editor.Phone.Missing')
                      }
                      checked={field.value && hasPhone}
                      disabled={!hasPhone}
                      onChange={field.onChange}
                    />
                  )}
                />
              </>
            ) : (
              <Controller
                name="delivery" control={control}
                rules={{
                  validate: v =>
                    v.length > 0 ||
                    (isService ? t('Editor.Where.Required') : t('Editor.Delivery.Required')),
                }}
                render={({ field }) => (
                  <Delivery
                    options={deliveryOptions} value={field.value} kind={kind}
                    onChange={field.onChange} error={errors.delivery?.message}
                  />
                )}
              />
            )}
            </div>
          </Accordion>

          {isProperty && (
            <Accordion
              key={`property-${problems.property}`}
              title={t('Editor.Section.PropertyDetails')}
              summary={<PropertySummaryLine control={control} />}
              problem={problems.property}
            >
              <div className="flex flex-col gap-6">
                <div className="grid gap-6 sm:grid-cols-3">
                  <Input
                    label={t('Editor.Area.Built')} inputMode="decimal"
                    error={errors.builtArea?.message}
                    {...register('builtArea', {
                      required: t('Editor.Area.BuiltRequired'),
                      min: { value: 1, message: t('Editor.Area.BuiltRequired') },
                    })}
                  />
                  <Input
                    label={t('Editor.Area.Private')} inputMode="decimal" optional
                    hint={t('Editor.Area.PrivateHint')}
                    error={errors.privateArea?.message}
                    {...register('privateArea', {
                      // The same rule the database holds, checked here so the
                      // seller is told before the round trip rather than by it.
                      validate: (value, form) =>
                        !value || !form.builtArea || Number(value) <= Number(form.builtArea) ||
                        t('Editor.Area.PrivateHint'),
                    })}
                  />
                  <Input
                    label={t('Editor.Area.Lot')} inputMode="decimal" optional
                    hint={t('Editor.Area.LotHint')}
                    {...register('lotArea')}
                  />
                </div>

                {/* Zero is a real answer for all four — a studio has no
                    separate bedroom, a lot has no bathroom — so they are
                    numbers with a floor rather than required fields. */}
                <div className="grid gap-6 sm:grid-cols-4">
                  <Input label={t('Editor.Rooms.Bedrooms')} type="number" min="0" {...register('bedrooms')} />
                  <Input label={t('Editor.Rooms.Bathrooms')} type="number" min="0" {...register('bathrooms')} />
                  <Input label={t('Editor.Rooms.HalfBaths')} type="number" min="0" {...register('halfBaths')} />
                  <Input label={t('Editor.Rooms.Parking')} type="number" min="0" {...register('parking')} />
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  <Controller
                    name="stratum" control={control}
                    render={({ field }) => (
                      <Select
                        label={t('Editor.Stratum.Label')} options={strata}
                        hint={t('Editor.Stratum.Hint')}
                        value={field.value} onChange={field.onChange}
                        placeholder={t('Properties.Filters.Any')}
                        optional
                      />
                    )}
                  />
                  <Input
                    label={t('Editor.Floor.Label')} type="number" optional
                    hint={t('Editor.Floor.Hint')}
                    {...register('floor')}
                  />
                  <Input
                    label={t('Editor.BuiltYear.Label')} type="number" optional
                    placeholder="2018"
                    {...register('builtYear')}
                  />
                </div>

                {/* Only a tenant is ever asked whether it is included, and the
                    database refuses the tick on a sale rather than storing a
                    line nobody can act on. */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <Input
                    label={t('Editor.Admin.Fee')} prefix="$" inputMode="decimal" optional
                    hint={t('Editor.Admin.FeeHint')}
                    {...register('adminFee')}
                  />
                  {renting && (
                    <Controller
                      name="adminIncluded" control={control}
                      render={({ field }) => (
                        <Checkbox
                          label={t('Editor.Admin.Included')}
                          checked={field.value}
                          onChange={field.onChange}
                          className="sm:mt-7"
                        />
                      )}
                    />
                  )}
                </div>

                <Controller
                  name="features" control={control}
                  render={({ field }) => (
                    <fieldset className="flex flex-col gap-1.5">
                      <legend className={labelClass}>{t('Editor.Features.Label')}</legend>
                      <p className="text-xs text-muted">{t('Editor.Features.Hint')}</p>

                      <div className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                        {featureOptions.map(feature => (
                          <Checkbox
                            key={feature.value}
                            label={feature.label}
                            checked={field.value.includes(feature.value)}
                            onChange={() =>
                              field.onChange(
                                field.value.includes(feature.value)
                                  ? field.value.filter(f => f !== feature.value)
                                  : [...field.value, feature.value],
                              )
                            }
                          />
                        ))}
                      </div>
                    </fieldset>
                  )}
                />
              </div>
            </Accordion>
          )}

          <Accordion title={t('Editor.Section.Photos')} summary={photoSummary}>
            <Photos
              tiles={tiles}
              kind={kind}
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
              {id ? t('Editor.SaveChanges') : t('Editor.SaveAsDraft')}
            </Button.Action>

            {(!product || !['active', 'paused'].includes(product.status)) && (
              <Button.Action
                type="button" disabled={busy}
                onClick={handleSubmit(values => save(values, { publish: true }))}
              >
                {id ? t('Editor.SaveAndPublish') : t('Listings.Publish')}
              </Button.Action>
            )}

            {product && product.status !== 'archived' && (
              <Button.Action
                type="button" variant="ghost" disabled={busy}
                onClick={() => setArchiving(true)}
              >
                {t('Listings.Archive')}
              </Button.Action>
            )}

            {product && (
              <Button.Action
                type="button" variant="ghost" color="danger" disabled={busy}
                className="ml-auto"
                onClick={() => setConfirming(true)}
              >
                {t('Listings.Delete')}
              </Button.Action>
            )}
          </div>
        </form>

        {/* Neutral rather than red: archiving is a decision, not a loss, and
            a red button here would teach the seller that the red one is the
            harmless one. */}
        <Confirm
          open={archiving}
          title={t('Listings.ArchiveConfirm.TitleNamed', { title: product?.title ?? t('Listings.DeleteConfirm.ThisListing') })}
          body={t('Listings.ArchiveConfirm.Body')}
          confirmLabel={t('Listings.ArchiveConfirm.Label')}
          confirmColor="neutral"
          loading={busy}
          onConfirm={archive}
          onCancel={() => setArchiving(false)}
        />

        <Confirm
          open={confirming}
          title={t('Listings.DeleteConfirm.TitleNamed', { title: product?.title ?? t('Listings.DeleteConfirm.ThisListing') })}
          body={t('Listings.DeleteConfirm.Body')}
          confirmLabel={t('Listings.DeleteConfirm.Label')}
          loading={busy}
          onConfirm={remove}
          onCancel={() => setConfirming(false)}
        />
      </div>
    </div>
  )
}

export default Editor
