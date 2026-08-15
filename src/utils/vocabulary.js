import { CATEGORY_LABELS } from './categoryLabels'
import { formatMoney } from './money'

// Condition, delivery and shop-shipping are interface copy, not database
// content: `/public/meta` sends only the raw value plaza's forms validate
// against, and these maps turn each one into the translated key that says it
// in the shopper's words.
const CONDITION_KEY = {
  new: 'New',
  like_new: 'LikeNew',
  good: 'Good',
  acceptable: 'Acceptable',
  for_parts: 'ForParts',
}

const DELIVERY_KEY = {
  shipping: 'Shipping',
  door_delivery: 'DoorDelivery',
  door_pickup: 'DoorPickup',
  public_meetup: 'PublicMeetup',
}

const SHOP_SHIPPING_KEY = {
  seller: 'Seller',
  plaza: 'Plaza',
  pickup: 'Pickup',
}

// What a service's rate buys, and where the work happens. The second is the
// same question `delivery` asks of a product — how the two of you meet — which
// is why it rides on the same column and gets the same shape here.
const RATE_UNIT_KEY = {
  hour: 'Hour',
  day: 'Day',
  job: 'Job',
}

const SERVICE_DELIVERY_KEY = {
  at_client: 'AtClient',
  at_provider: 'AtProvider',
  remote: 'Remote',
}

// The property half of the same vocabulary. Same shape, same reason: the API
// sends the raw value its columns validate against, and the words for it are
// interface copy that has to exist in three languages.
const OPERATION_KEY = {
  sale: 'Sale',
  rent: 'Rent',
}

// Not the same question a good's condition asks. `off_plan` is sobre planos —
// sold before it is built — which has no equivalent among second-hand objects.
const PROPERTY_CONDITION_KEY = {
  new: 'New',
  used: 'Used',
  off_plan: 'OffPlan',
}

// How much of the address a stranger is shown. Three levels rather than a
// switch, because the useful answer is usually the middle one.
const ADDRESS_VISIBILITY_KEY = {
  exact: 'Exact',
  street: 'Street',
  hidden: 'Hidden',
}

const withLabels = (t, options, namespace, keyOf) =>
  options.map(option => ({
    ...option,
    label: t(`Vocabulary.${namespace}.${keyOf[option.value]}.Label`),
    subtitle: t(`Vocabulary.${namespace}.${keyOf[option.value]}.Subtitle`),
  }))

export const withConditionLabels = (t, options) => withLabels(t, options, 'Condition', CONDITION_KEY)
export const withDeliveryLabels = (t, options) => withLabels(t, options, 'Delivery', DELIVERY_KEY)
export const withShopShippingLabels = (t, options) => withLabels(t, options, 'ShopShipping', SHOP_SHIPPING_KEY)
export const withRateUnitLabels = (t, options) => withLabels(t, options, 'RateUnit', RATE_UNIT_KEY)
export const withServiceDeliveryLabels = (t, options) =>
  withLabels(t, options, 'ServiceDelivery', SERVICE_DELIVERY_KEY)

/**
 * How the two of you meet, whichever kind of listing this is.
 *
 * One call site instead of two branches everywhere: the editor, the listing
 * page and the summaries all ask the same question and only the vocabulary
 * behind it changes.
 */
export const withHandoverLabels = (t, kind, options) =>
  kind === 'service' ? withServiceDeliveryLabels(t, options) : withDeliveryLabels(t, options)

export const withOperationLabels = (t, options) => withLabels(t, options, 'Operation', OPERATION_KEY)
export const withPropertyConditionLabels = (t, options) =>
  withLabels(t, options, 'PropertyCondition', PROPERTY_CONDITION_KEY)
export const withAddressVisibilityLabels = (t, options) =>
  withLabels(t, options, 'AddressVisibility', ADDRESS_VISIBILITY_KEY)

/**
 * The amenities, translated.
 *
 * A flat list rather than the label/subtitle pair the others use: there are
 * twenty-two of them and they go in a grid of checkboxes, where a second line
 * under each would be a wall of text explaining what a lift is.
 */
export const withFeatureLabels = (t, options) =>
  options.map(option => ({
    ...option,
    label: t(`Vocabulary.Feature.${option.value}`),
  }))

// The estrato, which is a number and stays a number. Labelled rather than left
// bare so a picker does not show a column of digits with no idea what they
// count.
export const stratumLabel = (t, stratum) =>
  stratum ? t('Vocabulary.Stratum.Value', { stratum }) : null

// The short word after the slash: "$45.000 / hora". Its own key rather than
// the option's label, because "Por hora" reads wrong in that position.
export const rateUnitShort = (t, unit) =>
  unit ? t(`Vocabulary.RateUnit.${RATE_UNIT_KEY[unit]}.Short`) : null

// Categories are real database content, sent by `/public/meta` in Spanish —
// the language they were seeded in. `CATEGORY_LABELS` is a frontend lookup
// keyed by the same `slug` the backend already sends, so Spanish keeps coming
// straight from the API (it needs no translation, being the source language)
// and only English/Portuguese are looked up. A category with no entry there
// — anything added to the seeder after this file was last updated — simply
// keeps showing its Spanish name, which is what everyone sees today anyway.
const categoryLabel = (language, category) =>
  (language === 'es' ? category.label : CATEGORY_LABELS[category.slug]?.[language]) ?? category.label

/**
 * The category tree, translated, and narrowed to one aisle when asked.
 *
 * `kind` is optional so that every existing call site keeps working: absent,
 * this is the whole tree the way it always was. The form passes it, because a
 * caregiver filed under Televisores is a listing nobody will ever find.
 */
export const withCategoryLabels = (language, categories, kind = null) =>
  categories
    .filter(parent => !kind || parent.kind === kind)
    .map(parent => ({
      ...parent,
      label: categoryLabel(language, parent),
      children: (parent.children ?? []).map(child => ({
        ...child,
        label: categoryLabel(language, child),
      })),
    }))

/**
 * What a listing costs, said the way its kind is priced.
 *
 * A product carries an amount. A service carries an amount and the unit it
 * buys — "$45.000" alone is unreadable when it could be an hour or a week —
 * or no amount at all, which is a real answer and not a missing one.
 */
export const formatRate = (t, listing) => {
  // A rent is a price with a period attached, and the period is not optional:
  // two and a half million reads as a bargain for a flat and as robbery for a
  // month, and the only thing telling them apart is the word after it.
  if (listing.kind === 'property') {
    const amount = formatMoney(listing.price, listing.currency)
    return listing.property?.operation === 'rent' ? `${amount} / ${t('Vocabulary.Operation.Rent.Short')}` : amount
  }

  if (listing.kind !== 'service') return formatMoney(listing.price, listing.currency)
  if (listing.price === null || listing.price === undefined) return t('Common.OnRequest')

  const amount = formatMoney(listing.price, listing.currency)
  const unit = rateUnitShort(t, listing.rateUnit)

  return unit ? `${amount} / ${unit}` : amount
}

/**
 * The line under a property's price: what it is, in numbers.
 *
 * "3 hab · 2 baños · 62 m²" is the whole of what somebody scanning a grid
 * reads, and it has to survive a listing that answers only some of it — a lot
 * has no bedrooms and a studio has no separate one. Empty parts are dropped
 * rather than printed as zero, because "0 hab" reads as a mistake.
 */
export const propertySummary = (t, property) => {
  if (!property) return null

  const parts = []

  if (property.bedrooms > 0) parts.push(t('Vocabulary.Property.Bedrooms', { count: property.bedrooms }))
  if (property.bathrooms > 0) parts.push(t('Vocabulary.Property.Bathrooms', { count: property.bathrooms }))
  if (property.parking > 0) parts.push(t('Vocabulary.Property.Parking', { count: property.parking }))
  if (property.builtArea) parts.push(t('Vocabulary.Property.Area', { area: Math.round(Number(property.builtArea)) }))

  return parts.join(' · ')
}
